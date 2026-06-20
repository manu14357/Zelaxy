import OpenAI from 'openai'
import { env } from '@/lib/env'
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
import { executeTool } from '@/tools'

/**
 * Factory for OpenAI-compatible chat providers (OpenRouter, Together, Fireworks, Mistral, …).
 *
 * These services all expose the OpenAI Chat Completions API at a different base URL, so a single
 * implementation — streaming, the tool-calling loop, structured output and timing — is shared
 * here and each provider is a thin wrapper that supplies its `baseURL` and catalog id. This mirrors
 * the behavior of the hand-written providers (e.g. the Groq provider) while avoiding duplication.
 *
 * Structured output is enforced via the system-prompt instructions injected by
 * `executeProviderRequest` (so it works on every endpoint regardless of native `response_format`
 * support); we deliberately do not set `response_format` at the API level to stay portable.
 */
export interface OpenAICompatibleProviderOptions {
  id: string
  name: string
  description: string
  /**
   * Default base URL. May be '' for providers whose endpoint is user-specific (vLLM, LiteLLM) —
   * in that case the URL must come from `request.baseUrl` or the `envBaseUrlVar` env var.
   */
  baseURL: string
  /** Stripped from the model id before the API call (e.g. 'openrouter/'). */
  modelPrefix?: string
  /** Extra headers sent on every request (e.g. OpenRouter's referer/title). */
  defaultHeaders?: Record<string, string>
  /** Env var consulted (server-side) for the base URL when the request doesn't carry one. */
  envBaseUrlVar?: string
}

const MAX_ITERATIONS = 10

function createReadableStreamFromOpenAIStream(stream: any): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

export function createOpenAICompatibleProvider(
  options: OpenAICompatibleProviderOptions
): ProviderConfig {
  const { id, name, description, baseURL, modelPrefix, defaultHeaders, envBaseUrlVar } = options
  const logger = createLogger(`${name}Provider`)

  const toApiModel = (model: string): string =>
    modelPrefix && model.startsWith(modelPrefix) ? model.slice(modelPrefix.length) : model

  // Resolve the base URL at request time: explicit per-request value wins, then the server env
  // var, then the provider's default. Trailing slashes are trimmed so the OpenAI SDK appends paths
  // correctly. Providers with a user-specific endpoint (vLLM/LiteLLM) ship `baseURL: ''` and error
  // clearly when nothing is configured.
  const resolveBaseURL = (request: ProviderRequest): string => {
    const envFallback = envBaseUrlVar ? (env as Record<string, any>)[envBaseUrlVar] : undefined
    const resolved = (request.baseUrl?.trim() || envFallback?.trim() || baseURL || '').replace(
      /\/+$/,
      ''
    )
    if (!resolved) {
      throw new Error(
        `Base URL is required for ${name}. Set it on the Agent block's "Base URL" field${
          envBaseUrlVar ? ` or the ${envBaseUrlVar} environment variable` : ''
        }.`
      )
    }
    return resolved
  }

  return {
    id,
    name,
    description,
    version: '1.0.0',
    models: getProviderModels(id),
    defaultModel: getProviderDefaultModel(id),

    executeRequest: async (
      request: ProviderRequest
    ): Promise<ProviderResponse | StreamingExecution> => {
      if (!request.apiKey) {
        throw new Error(`API key is required for ${name}`)
      }

      const client = new OpenAI({
        apiKey: request.apiKey,
        baseURL: resolveBaseURL(request),
        ...(defaultHeaders ? { defaultHeaders } : {}),
      })

      const requestedModel = request.model || getProviderDefaultModel(id)
      const apiModel = toApiModel(requestedModel)

      // Assemble messages: system prompt, then context, then conversation history.
      const allMessages: any[] = []
      if (request.systemPrompt) {
        allMessages.push({ role: 'system', content: request.systemPrompt })
      }
      if (request.context) {
        allMessages.push({ role: 'user', content: request.context })
      }
      if (request.messages) {
        allMessages.push(...request.messages)
      }

      // Transform tools to OpenAI function format if provided.
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

      const payload: any = {
        model: apiModel,
        messages: allMessages,
      }

      if (request.temperature !== undefined) payload.temperature = request.temperature
      if (request.maxTokens !== undefined && request.maxTokens >= 1)
        payload.max_tokens = request.maxTokens
      if (request.topP !== undefined) payload.top_p = request.topP
      if (request.presencePenalty !== undefined) payload.presence_penalty = request.presencePenalty
      if (request.frequencyPenalty !== undefined)
        payload.frequency_penalty = request.frequencyPenalty

      // Handle tools: filter out usageControl='none'; treat 'force' as 'auto' for portability.
      if (tools?.length) {
        const filteredTools = tools.filter((tool) => {
          const toolId = tool.function?.name
          const toolConfig = request.tools?.find((t) => t.id === toolId)
          return toolConfig?.usageControl !== 'none'
        })

        if (filteredTools?.length) {
          payload.tools = filteredTools
          payload.tool_choice = 'auto'
        }
      }

      // EARLY STREAMING: caller requested streaming and there are no tools to execute.
      if (request.stream && (!tools || tools.length === 0)) {
        logger.info(`Using streaming response for ${name} request (no tools)`)

        const providerStartTime = Date.now()
        const providerStartTimeISO = new Date(providerStartTime).toISOString()

        const streamResponse = await client.chat.completions.create({ ...payload, stream: true })

        const streamingResult = {
          stream: createReadableStreamFromOpenAIStream(streamResponse),
          execution: {
            success: true,
            output: {
              content: '',
              model: requestedModel,
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

      const providerStartTime = Date.now()
      const providerStartTimeISO = new Date(providerStartTime).toISOString()

      try {
        const initialCallTime = Date.now()

        let currentResponse = await client.chat.completions.create(payload)
        const firstResponseTime = Date.now() - initialCallTime

        let content = currentResponse.choices[0]?.message?.content || ''
        const tokens = {
          prompt: currentResponse.usage?.prompt_tokens || 0,
          completion: currentResponse.usage?.completion_tokens || 0,
          total: currentResponse.usage?.total_tokens || 0,
        }
        const toolCalls = []
        const toolResults = []
        const currentMessages = [...allMessages]
        let iterationCount = 0

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

        // For copilot requests, return tool calls without auto-executing them — the copilot
        // has its own tool registry separate from workflow block tools.
        if (request.isCopilotRequest) {
          const toolCallsInResponse = currentResponse.choices[0]?.message?.tool_calls
          if (toolCallsInResponse && toolCallsInResponse.length > 0) {
            const copilotToolCalls = toolCallsInResponse.map((tc: any) => ({
              id: tc.id,
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments || '{}'),
            }))

            return {
              content: content || '',
              model: requestedModel,
              tokens,
              toolCalls: copilotToolCalls,
            }
          }
        }

        try {
          while (iterationCount < MAX_ITERATIONS) {
            const toolCallsInResponse = currentResponse.choices[0]?.message?.tool_calls
            if (!toolCallsInResponse || toolCallsInResponse.length === 0) {
              break
            }

            const toolsStartTime = Date.now()

            for (const toolCall of toolCallsInResponse) {
              try {
                const toolName = toolCall.function.name
                const toolArgs = JSON.parse(toolCall.function.arguments)

                const tool = request.tools?.find((t) => t.id === toolName)
                if (!tool) continue

                const toolCallStartTime = Date.now()

                const toolParams = { ...tool.params, ...toolArgs }
                const executionParams = {
                  ...toolParams,
                  ...(request.workflowId
                    ? {
                        _context: {
                          workflowId: request.workflowId,
                          ...(request.workspaceId ? { workspaceId: request.workspaceId } : {}),
                          ...(request.chatId ? { chatId: request.chatId } : {}),
                        },
                      }
                    : {}),
                  ...(request.environmentVariables
                    ? { envVars: request.environmentVariables }
                    : {}),
                }

                const result = await executeTool(toolName, executionParams, true)
                const toolCallEndTime = Date.now()
                const toolCallDuration = toolCallEndTime - toolCallStartTime

                timeSegments.push({
                  type: 'tool',
                  name: toolName,
                  startTime: toolCallStartTime,
                  endTime: toolCallEndTime,
                  duration: toolCallDuration,
                })

                let resultContent: any
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
                  duration: toolCallDuration,
                  result: resultContent,
                  success: result.success,
                })

                currentMessages.push({
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: toolCall.id,
                      type: 'function',
                      function: {
                        name: toolName,
                        arguments: toolCall.function.arguments,
                      },
                    },
                  ],
                })

                currentMessages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: toonEncodeForLLM(resultContent),
                })
              } catch (error) {
                logger.error('Error processing tool call:', { error })
              }
            }

            const thisToolsTime = Date.now() - toolsStartTime
            toolsTime += thisToolsTime

            const nextPayload = { ...payload, messages: currentMessages }

            const nextModelStartTime = Date.now()
            currentResponse = await client.chat.completions.create(nextPayload)
            const nextModelEndTime = Date.now()
            const thisModelTime = nextModelEndTime - nextModelStartTime

            timeSegments.push({
              type: 'model',
              name: `Model response (iteration ${iterationCount + 1})`,
              startTime: nextModelStartTime,
              endTime: nextModelEndTime,
              duration: thisModelTime,
            })

            modelTime += thisModelTime

            if (currentResponse.choices[0]?.message?.content) {
              content = currentResponse.choices[0].message.content
            }

            if (currentResponse.usage) {
              tokens.prompt += currentResponse.usage.prompt_tokens || 0
              tokens.completion += currentResponse.usage.completion_tokens || 0
              tokens.total += currentResponse.usage.total_tokens || 0
            }

            iterationCount++
          }
        } catch (error) {
          logger.error(`Error in ${name} request:`, { error })
        }

        // If streaming was requested and tools ran, stream the final response.
        if (request.stream && iterationCount > 0) {
          logger.info(`Using streaming for final ${name} response after tool calls`)

          const streamingPayload = {
            ...payload,
            messages: currentMessages,
            tool_choice: 'auto',
            stream: true,
          }

          const streamResponse = await client.chat.completions.create(streamingPayload)

          const streamingResult = {
            stream: createReadableStreamFromOpenAIStream(streamResponse),
            execution: {
              success: true,
              output: {
                content: '',
                model: requestedModel,
                tokens: {
                  prompt: tokens.prompt,
                  completion: tokens.completion,
                  total: tokens.total,
                },
                toolCalls:
                  toolCalls.length > 0 ? { list: toolCalls, count: toolCalls.length } : undefined,
                providerTiming: {
                  startTime: providerStartTimeISO,
                  endTime: new Date().toISOString(),
                  duration: Date.now() - providerStartTime,
                  modelTime: modelTime,
                  toolsTime: toolsTime,
                  firstResponseTime: firstResponseTime,
                  iterations: iterationCount + 1,
                  timeSegments: timeSegments,
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

        const providerEndTime = Date.now()
        const providerEndTimeISO = new Date(providerEndTime).toISOString()
        const totalDuration = providerEndTime - providerStartTime

        return {
          content,
          model: requestedModel,
          tokens,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          toolResults: toolResults.length > 0 ? toolResults : undefined,
          timing: {
            startTime: providerStartTimeISO,
            endTime: providerEndTimeISO,
            duration: totalDuration,
            modelTime: modelTime,
            toolsTime: toolsTime,
            firstResponseTime: firstResponseTime,
            iterations: iterationCount + 1,
            timeSegments: timeSegments,
          },
        }
      } catch (error) {
        const providerEndTime = Date.now()
        const providerEndTimeISO = new Date(providerEndTime).toISOString()
        const totalDuration = providerEndTime - providerStartTime

        logger.error(`Error in ${name} request:`, { error, duration: totalDuration })

        const enhancedError = new Error(error instanceof Error ? error.message : String(error))
        // @ts-ignore - Adding timing property to the error
        enhancedError.timing = {
          startTime: providerStartTimeISO,
          endTime: providerEndTimeISO,
          duration: totalDuration,
        }

        throw enhancedError
      }
    },
  }
}
