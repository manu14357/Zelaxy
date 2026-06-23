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

/**
 * Decode a PARTIAL JSON string value (the characters AFTER the opening quote) up to the closing
 * unescaped quote, handling \n \t \" \\ \uXXXX etc. Stops before an incomplete trailing escape so
 * a half-streamed escape isn't mis-decoded. Used to stream a tool call's `content` value live as it
 * generates inside text markup.
 */
function decodeJsonStringPartial(s: string): { value: string; closed: boolean } {
  const ESCAPES: Record<string, string> = {
    n: '\n',
    t: '\t',
    r: '\r',
    b: '\b',
    f: '\f',
    '"': '"',
    '\\': '\\',
    '/': '/',
  }
  let out = ''
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === '"') return { value: out, closed: true }
    if (c === '\\') {
      const next = s[i + 1]
      if (next === undefined) break // incomplete escape — wait for more
      if (next === 'u') {
        if (i + 6 > s.length) break // incomplete \uXXXX
        out += String.fromCharCode(Number.parseInt(s.slice(i + 2, i + 6), 16))
        i += 6
        continue
      }
      out += ESCAPES[next] ?? next
      i += 2
      continue
    }
    out += c
    i++
  }
  return { value: out, closed: false }
}

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

      // ── LIVE-STREAMING COPILOT TURN ──────────────────────────────────────────────────────────
      // When the copilot loop passes an `onStreamText` callback, stream the assistant's text deltas
      // to it as the model generates them while assembling tool calls from the SAME stream. Returns
      // the tool calls UNEXECUTED (the caller runs them) — so the agent loop shows narration
      // token-by-token instead of waiting for the whole non-streaming turn.
      if (request.isCopilotRequest && tools?.length && typeof request.onStreamText === 'function') {
        let streamedContent = ''
        try {
          logger.info('MiMo: live-streaming copilot turn (stream + tools)')
          const streamResp: any = await mimo.chat.completions.create({ ...payload, stream: true })
          const toolAcc: Array<{ id: string; name: string; arguments: string }> = []
          let contentDeltas = 0
          // MiMo sometimes emits a tool call as literal markup IN the content (`<seed:tool_call>` /
          // `<function>{json}</function>`). Never stream that markup to the client — stop streaming
          // text at the first marker (the rest is the tool call, parsed below). `sentLen` tracks
          // what we've streamed; HOLDBACK keeps back a small tail so a marker forming across deltas
          // isn't half-streamed before we detect it.
          const TOOL_MARKER = /<(?:seed:)?tool_call|<function[=>]/i
          const HOLDBACK = 24
          let sentLen = 0
          let markupStarted = false
          // File streaming: once a doc-writing tool call appears — EITHER as text markup (in
          // delta.content) OR as a STRUCTURED tool call (args JSON in delta.tool_calls) — stream its
          // `content` value to onFileStream so the side panel renders the document LIVE as written.
          let fileDeltas = 0
          let fileName: string | undefined
          let fileValueStart = -1
          let fileSent = 0
          const emitFileFrom = async (source: string, fromArgs: boolean) => {
            if (typeof request.onFileStream !== 'function') return
            if (fileValueStart < 0) {
              // For text markup the tool name is `"name":"create_file"`; for structured args the
              // toolAcc carries the name separately, so the source's first `"name"` is the file name.
              if (
                !fromArgs &&
                !/"name"\s*:\s*"(?:create_file|append_file|write_file)"/.test(source)
              )
                return
              const cm = source.match(/"content"\s*:\s*"/)
              if (!cm || cm.index === undefined) return
              fileValueStart = cm.index + cm[0].length
              const nm = fromArgs
                ? source.match(/"name"\s*:\s*"([^"]*)"/)
                : source.match(/"arguments"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]*)"/)
              fileName = nm ? nm[1] : undefined
            }
            const { value } = decodeJsonStringPartial(source.slice(fileValueStart))
            if (value.length > fileSent) {
              const delta = value.slice(fileSent)
              fileSent = value.length
              fileDeltas++
              await request.onFileStream({ name: fileName, delta })
            }
          }
          const emitFileContent = () => emitFileFrom(streamedContent, false)
          const emitStructuredFileContent = async () => {
            const fi = toolAcc.findIndex(
              (t) => t && /^(?:create_file|append_file|write_file)$/.test(t.name)
            )
            if (fi >= 0) await emitFileFrom(toolAcc[fi].arguments, true)
          }
          for await (const chunk of streamResp) {
            const delta = chunk.choices?.[0]?.delta
            if (delta?.content) {
              streamedContent += delta.content
              contentDeltas++
              if (!markupStarted) {
                const markerIdx = streamedContent.search(TOOL_MARKER)
                if (markerIdx >= 0) {
                  if (markerIdx > sentLen) {
                    await request.onStreamText(streamedContent.slice(sentLen, markerIdx))
                  }
                  sentLen = markerIdx
                  markupStarted = true
                } else {
                  // Stream all confirmed-clean text, holding back a possible partial-marker tail.
                  const safeEnd = Math.max(sentLen, streamedContent.length - HOLDBACK)
                  if (safeEnd > sentLen) {
                    await request.onStreamText(streamedContent.slice(sentLen, safeEnd))
                    sentLen = safeEnd
                  }
                }
              }
              // Stream the doc content (if this turn is writing a file) to the side panel, live.
              if (markupStarted) await emitFileContent()
            }
            if (Array.isArray(delta?.tool_calls)) {
              // A STRUCTURED tool call means the narration in `content` is finished and no text-markup
              // marker is coming — flush the held-back narration tail NOW so it isn't stuck behind
              // HOLDBACK for the whole (possibly long) tool-args stream.
              if (!markupStarted && streamedContent.length > sentLen) {
                await request.onStreamText(streamedContent.slice(sentLen))
                sentLen = streamedContent.length
              }
              for (const tcDelta of delta.tool_calls) {
                const idx = typeof tcDelta.index === 'number' ? tcDelta.index : toolAcc.length
                if (!toolAcc[idx]) toolAcc[idx] = { id: '', name: '', arguments: '' }
                const acc = toolAcc[idx]
                if (tcDelta.id) acc.id = tcDelta.id
                if (tcDelta.function?.name) acc.name += tcDelta.function.name
                if (tcDelta.function?.arguments) acc.arguments += tcDelta.function.arguments
              }
              // Structured create_file: stream its content live from the accumulating args JSON.
              await emitStructuredFileContent()
            }
          }

          // No tool-call markup appeared — flush the tail we held back so the full text reaches the
          // client. (If markup DID appear, the tail is part of the tool call and stays hidden.)
          if (!markupStarted && streamedContent.length > sentLen) {
            await request.onStreamText(streamedContent.slice(sentLen))
          }

          let finalContent = streamedContent
          let assembled = toolAcc.filter((t) => t && (t.name || t.id))
          // Diagnostic: contentDeltas == 1 means MiMo buffered the text into one chunk (no smooth
          // streaming); many means it streamed token-by-token.
          logger.info('MiMo: streamed turn complete', {
            contentDeltas,
            contentLength: streamedContent.length,
            toolCalls: assembled.length,
            // fileDeltas > 1 means the document streamed live to the side panel; 0 means no file
            // tool call this turn; 1 means MiMo emitted the whole content in one chunk (can't stream).
            fileDeltas,
          })
          // MiMo may emit tool calls as literal text instead of structured tool_calls — recover them.
          if (assembled.length === 0 && finalContent) {
            const textCalls = parseTextToolCalls(finalContent)
            if (textCalls.length > 0) {
              assembled = textCalls.map((tc: any) => ({
                id: tc.id,
                name: tc.function.name,
                arguments: tc.function.arguments,
              }))
              finalContent = stripTextToolCallMarkup(finalContent)
            }
          }
          // Safety: if the stream yielded NOTHING (no text and no tool calls — e.g. MiMo's streaming
          // format for this turn isn't what we expect), bail to the non-streaming path which reads
          // the response shape reliably, so we never silently drop the model's output.
          if (!finalContent && assembled.length === 0) {
            logger.warn(
              'MiMo stream yielded no content or tool calls; falling back to non-streaming'
            )
            throw new Error('empty-mimo-stream')
          }
          const cleanContent = finalContent
            ? finalContent.replace(/```json\n?|\n?```/g, '').trim()
            : ''
          return {
            content: cleanContent,
            model,
            tokens: { prompt: 0, completion: 0, total: 0 },
            toolCalls:
              assembled.length > 0
                ? assembled.map((tc) => ({
                    id: tc.id,
                    name: tc.name,
                    arguments: (() => {
                      try {
                        return JSON.parse(tc.arguments || '{}')
                      } catch {
                        return {}
                      }
                    })(),
                  }))
                : undefined,
          }
        } catch (streamErr) {
          // If text already streamed to the client we can't cleanly retry — surface the error.
          // Otherwise (e.g. the endpoint rejected stream+tools upfront) fall through to non-streaming.
          if (streamedContent) throw streamErr
          logger.warn('MiMo streaming-with-tools failed; falling back to non-streaming', {
            error: streamErr instanceof Error ? streamErr.message : String(streamErr),
          })
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
