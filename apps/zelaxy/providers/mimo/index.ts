import OpenAI from 'openai'
import { createLogger } from '@/lib/logs/console/logger'
import { toonEncodeForLLM } from '@/lib/toon/encoder'
import type { StreamingExecution } from '@/executor/types'
import { getProviderDefaultModel, getProviderModels } from '@/providers/models'
import type {
  ProviderConfig,
  ProviderRequest,
  ProviderResponse,
  TimeSegment,
} from '@/providers/types'
import {
  parseTextToolCalls,
  prepareToolExecution,
  prepareToolsWithUsageControl,
  stripTextToolCallMarkup,
  trackForcedToolUsage,
} from '@/providers/utils'
import { executeTool } from '@/tools'

const logger = createLogger('MiMoProvider')

// Xiaomi MiMo exposes an OpenAI-compatible API.
const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1'

function createReadableStreamFromMiMoStream(mimoStream: any): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of mimoStream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

export const mimoProvider: ProviderConfig = {
  id: 'mimo',
  name: 'MiMo',
  description: "Xiaomi's MiMo models",
  version: '1.0.0',
  models: getProviderModels('mimo'),
  defaultModel: getProviderDefaultModel('mimo'),

  executeRequest: async (
    request: ProviderRequest
  ): Promise<ProviderResponse | StreamingExecution> => {
    if (!request.apiKey) {
      throw new Error('API key is required for MiMo')
    }

    const providerStartTime = Date.now()
    const providerStartTimeISO = new Date(providerStartTime).toISOString()
    const model = request.model || getProviderDefaultModel('mimo')

    try {
      const mimo = new OpenAI({ apiKey: request.apiKey, baseURL: MIMO_BASE_URL })

      const allMessages = []
      if (request.systemPrompt) {
        allMessages.push({ role: 'system', content: request.systemPrompt })
      }
      if (request.context) {
        allMessages.push({ role: 'user', content: request.context })
      }
      if (request.messages) {
        allMessages.push(...request.messages)
      }

      const tools = request.tools?.length
        ? request.tools.map((tool) => ({
            type: 'function',
            function: {
              name: tool.id,
              description: tool.description,
              parameters: tool.parameters,
            },
          }))
        : undefined

      const payload: any = { model, messages: allMessages }
      if (request.temperature !== undefined) payload.temperature = request.temperature
      if (request.maxTokens !== undefined && request.maxTokens >= 1)
        payload.max_tokens = request.maxTokens
      if (request.topP !== undefined) payload.top_p = request.topP
      if (request.presencePenalty !== undefined) payload.presence_penalty = request.presencePenalty
      if (request.frequencyPenalty !== undefined)
        payload.frequency_penalty = request.frequencyPenalty

      let preparedTools: ReturnType<typeof prepareToolsWithUsageControl> | null = null
      if (tools?.length) {
        preparedTools = prepareToolsWithUsageControl(tools, request.tools, logger, 'mimo')
        const { tools: filteredTools, toolChoice } = preparedTools
        if (filteredTools?.length && toolChoice) {
          payload.tools = filteredTools
          payload.tool_choice = toolChoice
        }
      }

      // Direct streaming when no tools to execute.
      if (request.stream && (!tools || tools.length === 0)) {
        const streamResponse = await mimo.chat.completions.create({ ...payload, stream: true })
        const streamingResult = {
          stream: createReadableStreamFromMiMoStream(streamResponse),
          execution: {
            success: true,
            output: {
              content: '',
              model,
              tokens: { prompt: 0, completion: 0, total: 0 },
              toolCalls: undefined,
              providerTiming: {
                startTime: providerStartTimeISO,
                endTime: new Date().toISOString(),
                duration: Date.now() - providerStartTime,
                timeSegments: [
                  {
                    type: 'model',
                    name: 'Streaming response',
                    startTime: providerStartTime,
                    endTime: Date.now(),
                    duration: Date.now() - providerStartTime,
                  },
                ],
              },
              cost: { total: 0.0, input: 0.0, output: 0.0 },
            },
            logs: [],
            metadata: {
              startTime: providerStartTimeISO,
              endTime: new Date().toISOString(),
              duration: Date.now() - providerStartTime,
            },
            isStreaming: true,
          },
        }
        return streamingResult as StreamingExecution
      }

      const initialCallTime = Date.now()
      const originalToolChoice = payload.tool_choice
      const forcedTools = preparedTools?.forcedTools || []
      let usedForcedTools: string[] = []

      // MiMo sometimes returns tool calls as literal text in `content` instead of structured
      // `tool_calls`. When tools are available, synthesize the structured calls so they actually run.
      const applyTextToolCallFallback = (resp: any) => {
        const msg = resp?.choices?.[0]?.message
        if (!msg || !tools?.length) return
        if ((!msg.tool_calls || msg.tool_calls.length === 0) && typeof msg.content === 'string') {
          const textCalls = parseTextToolCalls(msg.content)
          if (textCalls.length > 0) {
            msg.tool_calls = textCalls
            msg.content = stripTextToolCallMarkup(msg.content)
          }
        }
      }

      let currentResponse = await mimo.chat.completions.create(payload)
      applyTextToolCallFallback(currentResponse)
      const firstResponseTime = Date.now() - initialCallTime

      let content = currentResponse.choices[0]?.message?.content || ''
      if (content) {
        content = content.replace(/```json\n?|\n?```/g, '').trim()
      }

      const tokens = {
        prompt: currentResponse.usage?.prompt_tokens || 0,
        completion: currentResponse.usage?.completion_tokens || 0,
        total: currentResponse.usage?.total_tokens || 0,
      }
      const toolCalls = []
      const toolResults = []
      const currentMessages = [...allMessages]
      let iterationCount = 0
      const MAX_ITERATIONS = 10

      let hasUsedForcedTool = false
      let modelTime = firstResponseTime
      let toolsTime = 0
      const timeSegments: TimeSegment[] = [
        {
          type: 'model',
          name: 'Initial response',
          startTime: initialCallTime,
          endTime: initialCallTime + firstResponseTime,
          duration: firstResponseTime,
        },
      ]

      if (
        typeof originalToolChoice === 'object' &&
        currentResponse.choices[0]?.message?.tool_calls
      ) {
        const result = trackForcedToolUsage(
          currentResponse.choices[0].message.tool_calls,
          originalToolChoice,
          logger,
          'mimo',
          forcedTools,
          usedForcedTools
        )
        hasUsedForcedTool = result.hasUsedForcedTool
        usedForcedTools = result.usedForcedTools
      }

      // Copilot requests: return tool calls without auto-executing.
      if (request.isCopilotRequest) {
        const toolCallsInResponse = currentResponse.choices[0]?.message?.tool_calls
        if (toolCallsInResponse && toolCallsInResponse.length > 0) {
          return {
            content: content || '',
            model,
            tokens,
            toolCalls: toolCallsInResponse.map((tc: any) => ({
              id: tc.id,
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments || '{}'),
            })),
          }
        }
      }

      try {
        while (iterationCount < MAX_ITERATIONS) {
          const toolCallsInResponse = currentResponse.choices[0]?.message?.tool_calls
          if (!toolCallsInResponse || toolCallsInResponse.length === 0) break

          const toolsStartTime = Date.now()

          // OpenAI message-history contract: ONE assistant message carrying ALL tool_calls, then
          // one `tool` message per call id. Pushing an assistant message per call (the old shape)
          // makes stricter backends reject with "tool_call_id did not have a tool response".
          currentMessages.push({
            role: 'assistant',
            content: currentResponse.choices[0]?.message?.content ?? null,
            tool_calls: toolCallsInResponse.map((tc: any) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.function.name, arguments: tc.function.arguments },
            })),
          })

          for (const toolCall of toolCallsInResponse) {
            const toolName = toolCall.function.name
            let resultContent: any
            try {
              const toolArgs = JSON.parse(toolCall.function.arguments || '{}')
              const tool = request.tools?.find((t) => t.id === toolName)
              if (!tool) {
                resultContent = {
                  error: true,
                  message: `Tool not found: ${toolName}`,
                  tool: toolName,
                }
              } else {
                const toolCallStartTime = Date.now()
                const { toolParams, executionParams } = prepareToolExecution(
                  tool,
                  toolArgs,
                  request
                )

                const result = await executeTool(toolName, executionParams, true)
                const toolCallEndTime = Date.now()
                timeSegments.push({
                  type: 'tool',
                  name: toolName,
                  startTime: toolCallStartTime,
                  endTime: toolCallEndTime,
                  duration: toolCallEndTime - toolCallStartTime,
                })

                if (result.success) {
                  toolResults.push(result.output)
                  resultContent = result.output
                } else {
                  resultContent = {
                    error: true,
                    message: result.error || 'Tool execution failed',
                    tool: toolName,
                  }
                }

                toolCalls.push({
                  name: toolName,
                  arguments: toolParams,
                  startTime: new Date(toolCallStartTime).toISOString(),
                  endTime: new Date(toolCallEndTime).toISOString(),
                  duration: toolCallEndTime - toolCallStartTime,
                  result: resultContent,
                  success: result.success,
                })
              }
            } catch (error) {
              logger.error('Error processing tool call:', { error })
              resultContent = {
                error: true,
                message: error instanceof Error ? error.message : 'Tool execution failed',
                tool: toolName,
              }
            }

            // Always answer every tool_call id, even skipped/errored ones, to keep the history valid.
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toonEncodeForLLM(resultContent),
            })
          }

          toolsTime += Date.now() - toolsStartTime

          const nextPayload = { ...payload, messages: currentMessages }
          if (
            typeof originalToolChoice === 'object' &&
            hasUsedForcedTool &&
            forcedTools.length > 0
          ) {
            const remainingTools = forcedTools.filter((tool) => !usedForcedTools.includes(tool))
            nextPayload.tool_choice =
              remainingTools.length > 0
                ? { type: 'function', function: { name: remainingTools[0] } }
                : 'auto'
          }

          const nextModelStartTime = Date.now()
          currentResponse = await mimo.chat.completions.create(nextPayload)
          applyTextToolCallFallback(currentResponse)

          if (
            typeof nextPayload.tool_choice === 'object' &&
            currentResponse.choices[0]?.message?.tool_calls
          ) {
            const result = trackForcedToolUsage(
              currentResponse.choices[0].message.tool_calls,
              nextPayload.tool_choice,
              logger,
              'mimo',
              forcedTools,
              usedForcedTools
            )
            hasUsedForcedTool = result.hasUsedForcedTool
            usedForcedTools = result.usedForcedTools
          }

          const thisModelTime = Date.now() - nextModelStartTime
          timeSegments.push({
            type: 'model',
            name: `Model response (iteration ${iterationCount + 1})`,
            startTime: nextModelStartTime,
            endTime: Date.now(),
            duration: thisModelTime,
          })
          modelTime += thisModelTime

          if (currentResponse.choices[0]?.message?.content) {
            content = currentResponse.choices[0].message.content
              .replace(/```json\n?|\n?```/g, '')
              .trim()
          }
          if (currentResponse.usage) {
            tokens.prompt += currentResponse.usage.prompt_tokens || 0
            tokens.completion += currentResponse.usage.completion_tokens || 0
            tokens.total += currentResponse.usage.total_tokens || 0
          }
          iterationCount++
        }
      } catch (error) {
        logger.error('Error in MiMo request:', { error })
      }

      const providerEndTime = Date.now()
      return {
        content,
        model,
        tokens,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        timing: {
          startTime: providerStartTimeISO,
          endTime: new Date(providerEndTime).toISOString(),
          duration: providerEndTime - providerStartTime,
          modelTime,
          toolsTime,
          firstResponseTime,
          iterations: iterationCount + 1,
          timeSegments,
        },
      }
    } catch (error) {
      const enhancedError = new Error(error instanceof Error ? error.message : String(error))
      // @ts-ignore - Adding timing property to the error
      enhancedError.timing = {
        startTime: providerStartTimeISO,
        endTime: new Date().toISOString(),
        duration: Date.now() - providerStartTime,
      }
      throw enhancedError
    }
  },
}
