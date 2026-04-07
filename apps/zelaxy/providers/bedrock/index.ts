import {
  type Message as BedrockMessage,
  BedrockRuntimeClient,
  type ContentBlock,
  type ConversationRole,
  ConverseCommand,
  type ConverseCommandInput,
  ConverseStreamCommand,
  type SystemContentBlock,
  type ToolConfiguration,
  type ToolResultContentBlock,
} from '@aws-sdk/client-bedrock-runtime'
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
import { prepareToolsWithUsageControl } from '@/providers/utils'
import { executeTool } from '@/tools'

const logger = createLogger('BedrockProvider')

// Default max output tokens — used when the caller doesn't specify one.
const DEFAULT_MAX_TOKENS = 128000

// Rough mapping of model-id prefixes to context-window sizes (in tokens).
// Used to pre-truncate messages so they fit the model's context.
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI on Bedrock — all gpt-oss models support 128K context
  // Source: https://aws.amazon.com/blogs/aws/openai-open-weight-models-now-available-on-aws/
  'openai.gpt-oss': 128_000,
  // Amazon Nova
  'amazon.nova-pro': 300_000,
  'amazon.nova-lite': 300_000,
  'amazon.nova-micro': 128_000,
  // Anthropic Claude
  'anthropic.claude-3-5': 200_000,
  'anthropic.claude-3': 200_000,
  'anthropic.claude-v2': 100_000,
  // Meta Llama
  'meta.llama3-1': 128_000,
  'meta.llama3-2': 128_000,
  'meta.llama3-3': 128_000,
  // Mistral
  'mistral.mistral-large-3': 256_000,
  'mistral.mistral-large-2': 128_000,
  'mistral.mistral-large': 128_000,
  'mistral.mistral-small': 32_768,
  'mistral.magistral': 128_000,
  'mistral.ministral': 128_000,
  'mistral.voxtral': 32_768,
  // Qwen — native 32K, 131K with YaRN; Bedrock likely serves with extended context
  'qwen.': 32_768,
  // Google Gemma 3
  'google.gemma-3': 128_000,
  // MiniMax
  'minimax.': 128_000,
  // Moonshot Kimi
  'moonshot.': 128_000,
  // NVIDIA Nemotron
  'nvidia.': 128_000,
}

/** Return the approximate context-window size for a Bedrock model id. */
function getModelContextWindow(modelId: string): number {
  const lower = modelId.toLowerCase()
  for (const [prefix, size] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (lower.startsWith(prefix)) return size
  }
  // Conservative fallback
  return 128_000
}

/**
 * Very conservative token-count estimate.
 * Actual tokenizer ratios vary wildly:
 *   - English prose: ~3-4 chars/token
 *   - JSON / structured data: ~1.2-1.8 chars/token
 *   - Mixed content with special chars: ~1.3-2 chars/token
 * We use 1.3 chars/token (the worst case) so we NEVER underestimate.
 * It's better to truncate slightly more than to blow through the context window.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 1.3)
}

/** Truncate a single message's text content to fit within `maxTokens` tokens. */
function truncateMessageContent(msg: any, maxTokens: number): any {
  const maxChars = Math.floor(maxTokens * 1.3) // inverse of estimateTokens (chars/1.3)
  if (typeof msg.content === 'string') {
    if (estimateTokens(msg.content) <= maxTokens) return msg
    logger.warn('Truncating individual message content', {
      role: msg.role,
      originalChars: msg.content.length,
      maxChars,
    })
    return {
      ...msg,
      content: `${msg.content.slice(0, maxChars)}\n\n[...content truncated to fit context window]`,
    }
  }
  if (Array.isArray(msg.content)) {
    // Multimodal content — truncate text parts
    let usedChars = 0
    const truncatedParts = msg.content.map((part: any) => {
      if (part.type === 'text' && typeof part.text === 'string') {
        const available = Math.max(0, maxChars - usedChars)
        usedChars += part.text.length
        if (part.text.length > available) {
          return { ...part, text: `${part.text.slice(0, available)}\n[...truncated]` }
        }
      }
      return part
    })
    return { ...msg, content: truncatedParts }
  }
  return msg
}

/**
 * Truncate the messages array so the total estimated token count fits within
 * `budget` tokens.  Two-phase strategy:
 *   1. Drop middle messages (keep first + most-recent).
 *   2. If still over budget, truncate the TEXT CONTENT of remaining messages.
 */
function truncateMessages(messages: any[], budget: number): any[] {
  if (messages.length === 0) return messages

  // Estimate per-message tokens
  const sizes = messages.map((m) => {
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '')
    return estimateTokens(content)
  })

  const totalTokens = sizes.reduce((a, b) => a + b, 0)
  if (totalTokens <= budget) return messages // already fits

  logger.warn('Truncating messages to fit context window', {
    originalMessages: messages.length,
    estimatedTokens: totalTokens,
    budget,
  })

  // ── Phase 1: Drop middle messages ────────────────────────────────
  let kept: any[]
  if (messages.length <= 1) {
    kept = [...messages]
  } else {
    const candidates: { msg: any; size: number }[] = []
    let usedTokens = 0

    // First message (context)
    candidates.push({ msg: messages[0], size: sizes[0] })
    usedTokens += sizes[0]

    // Walk backwards from the end, adding messages while we have budget
    const tail: { msg: any; size: number }[] = []
    for (let i = messages.length - 1; i >= 1; i--) {
      if (usedTokens + sizes[i] > budget) break
      tail.unshift({ msg: messages[i], size: sizes[i] })
      usedTokens += sizes[i]
    }
    candidates.push(...tail)
    kept = candidates.map((k) => k.msg)
  }

  // ── Phase 2: If still over budget, truncate content of each message ─
  const currentTotal = kept.reduce((sum, m) => {
    const c = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '')
    return sum + estimateTokens(c)
  }, 0)

  if (currentTotal > budget && kept.length > 0) {
    logger.warn('Still over budget after dropping messages — truncating message content', {
      keptMessages: kept.length,
      currentTotal,
      budget,
    })

    // Distribute budget proportionally, but give more weight to the last message
    // (the actual user turn) and less to earlier context.
    const lastIdx = kept.length - 1
    const perMsgBudget =
      kept.length > 1 ? Math.floor((budget * 0.3) / Math.max(1, kept.length - 1)) : budget
    const lastMsgBudget = kept.length > 1 ? budget - perMsgBudget * (kept.length - 1) : budget

    kept = kept.map((msg, i) => {
      const msgBudget = i === lastIdx ? lastMsgBudget : perMsgBudget
      return truncateMessageContent(msg, msgBudget)
    })
  }

  const finalTotal = kept.reduce((sum, m) => {
    const c = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '')
    return sum + estimateTokens(c)
  }, 0)

  logger.info('Message truncation complete', {
    originalMessages: messages.length,
    keptMessages: kept.length,
    droppedMessages: messages.length - kept.length,
    estimatedTokensBefore: totalTokens,
    estimatedTokensAfter: finalTotal,
    budget,
  })

  return kept
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBedrockClient(): BedrockRuntimeClient {
  const region = env.BEDROCK_REGION || 'us-east-1'
  const accessKeyId = env.BEDROCK_ACCESS_KEY_ID
  const secretAccessKey = env.BEDROCK_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS Bedrock credentials are required. Set BEDROCK_ACCESS_KEY_ID and BEDROCK_SECRET_ACCESS_KEY in your environment.'
    )
  }

  return new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

/** Convert provider messages → Bedrock Converse format */
function toBedrockMessages(messages: any[]): BedrockMessage[] {
  const bedrockMessages: BedrockMessage[] = []

  for (const msg of messages) {
    if (msg.role === 'system') continue // system is separate in Converse

    if (msg.role === 'tool') {
      // Tool result — merge into the previous user message or create a new one
      const toolContent: ToolResultContentBlock[] = [
        { text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) },
      ]
      bedrockMessages.push({
        role: 'user' as ConversationRole,
        content: [
          {
            toolResult: {
              toolUseId: msg.tool_call_id,
              content: toolContent,
            },
          },
        ],
      })
      continue
    }

    if (msg.role === 'assistant' && msg.tool_calls?.length) {
      // Assistant asking to use tools
      const content: ContentBlock[] = []
      if (msg.content) {
        content.push({ text: msg.content })
      }
      for (const tc of msg.tool_calls) {
        let args: Record<string, any> = {}
        try {
          args =
            typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments
        } catch {
          /* keep empty */
        }

        content.push({
          toolUse: {
            toolUseId: tc.id,
            name: tc.function.name,
            input: args,
          },
        })
      }
      bedrockMessages.push({ role: 'assistant' as ConversationRole, content })
      continue
    }

    // Regular user / assistant text
    const role: ConversationRole = msg.role === 'user' ? 'user' : 'assistant'
    let contentBlocks: ContentBlock[]

    if (typeof msg.content === 'string') {
      contentBlocks = [{ text: msg.content || ' ' }]
    } else if (Array.isArray(msg.content)) {
      // Multimodal content array (text + image_url + file)
      contentBlocks = msg.content.map((part: any) => {
        if (part.type === 'text') return { text: part.text }
        if (part.type === 'image_url' && part.image_url?.url) {
          // If it's a data URI, extract the bytes
          const url: string = part.image_url.url
          if (url.startsWith('data:')) {
            const [header, b64] = url.split(',')
            const mimeMatch = header.match(/data:(image\/\w+)/)
            const format = mimeMatch ? mimeMatch[1].split('/')[1] : 'png'
            return {
              image: {
                format: format as any,
                source: { bytes: Buffer.from(b64, 'base64') },
              },
            }
          }
          // External URL — Bedrock doesn't support URLs directly, pass as text
          return { text: `[Image: ${url}]` }
        }
        if (part.type === 'file' && part.file?.file_data) {
          // PDF / document via base64 data URI
          const dataUri: string = part.file.file_data
          if (dataUri.startsWith('data:')) {
            const [header, b64] = dataUri.split(',')
            const mimeMatch = header.match(/data:(.+?);/)
            const mime = mimeMatch ? mimeMatch[1] : 'application/pdf'
            const format = mime === 'application/pdf' ? 'pdf' : mime.split('/')[1]
            return {
              document: {
                format: format as any,
                name: (part.file.filename || 'document').replace(/[^a-zA-Z0-9_.-]/g, '_'),
                source: { bytes: Buffer.from(b64, 'base64') },
              },
            }
          }
          return { text: `[Document: ${part.file.filename}]` }
        }
        return { text: JSON.stringify(part) }
      })
    } else {
      contentBlocks = [{ text: msg.content ? JSON.stringify(msg.content) : ' ' }]
    }

    bedrockMessages.push({ role, content: contentBlocks })
  }

  return bedrockMessages
}

/** Convert tool definitions → Bedrock toolConfig */
function toBedrockToolConfig(tools: any[]): ToolConfiguration | undefined {
  if (!tools || tools.length === 0) return undefined
  return {
    tools: tools.map((t: any) => ({
      toolSpec: {
        name: t.function?.name || t.id,
        description: t.function?.description || t.description || '',
        inputSchema: {
          json: t.function?.parameters || t.parameters || { type: 'object', properties: {} },
        },
      },
    })),
  }
}

/** Create a ReadableStream from Bedrock ConverseStream response */
function createReadableStreamFromBedrockStream(bedrockStream: any): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of bedrockStream) {
          if (event.contentBlockDelta?.delta?.text) {
            controller.enqueue(new TextEncoder().encode(event.contentBlockDelta.delta.text))
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const bedrockProvider: ProviderConfig = {
  id: 'bedrock',
  name: 'AWS Bedrock',
  description: 'AWS Bedrock foundation models',
  version: '1.0.0',
  models: getProviderModels('bedrock'),
  defaultModel: getProviderDefaultModel('bedrock'),

  executeRequest: async (
    request: ProviderRequest
  ): Promise<ProviderResponse | StreamingExecution> => {
    const modelId = request.model || env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0'

    logger.info('Preparing AWS Bedrock request', {
      model: modelId,
      hasSystemPrompt: !!request.systemPrompt,
      hasMessages: !!request.messages?.length,
      hasTools: !!request.tools?.length,
      toolCount: request.tools?.length || 0,
      stream: !!request.stream,
    })

    const client = getBedrockClient()

    // ── Build message list ─────────────────────────────────────────────
    const allMessages: any[] = []

    if (request.context) {
      allMessages.push({ role: 'user', content: request.context })
    }

    if (request.messages) {
      allMessages.push(...request.messages)
    }

    // System prompt goes into the dedicated `system` field
    const system: SystemContentBlock[] | undefined = request.systemPrompt
      ? [{ text: request.systemPrompt }]
      : undefined

    // ── Tools ──────────────────────────────────────────────────────────
    const providerTools = request.tools?.length
      ? request.tools.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.id,
            description: tool.description,
            parameters: tool.parameters,
          },
        }))
      : undefined

    let preparedTools: ReturnType<typeof prepareToolsWithUsageControl> | null = null
    let toolConfig: ToolConfiguration | undefined

    if (providerTools?.length) {
      preparedTools = prepareToolsWithUsageControl(providerTools, request.tools, logger, 'bedrock')
      const { tools: filteredTools } = preparedTools
      if (filteredTools?.length) {
        toolConfig = toBedrockToolConfig(filteredTools)
      }
    }

    // ── Execution timer ────────────────────────────────────────────────
    const providerStartTime = Date.now()
    const providerStartTimeISO = new Date(providerStartTime).toISOString()

    // ── Clamp maxTokens to a safe positive value ────────────────────
    // ALWAYS send a positive maxTokens so Bedrock never internally computes
    // a negative remainder (contextWindow − inputTokens).
    const safeMaxTokens =
      request.maxTokens !== undefined && request.maxTokens >= 1
        ? request.maxTokens
        : DEFAULT_MAX_TOKENS

    // ── Pre-truncate messages to fit the model's context window ─────
    // Reserve tokens for the output + system prompt + tool definitions.
    // Use an adaptive safety margin: larger windows can afford a tighter
    // ratio because tokenizer estimation errors are a smaller fraction.
    const contextWindow = getModelContextWindow(modelId)
    const safetyRatio = contextWindow <= 16_384 ? 0.85 : contextWindow <= 32_768 ? 0.8 : 0.75
    const usableContextWindow = Math.floor(contextWindow * safetyRatio)
    const systemTokens = system ? estimateTokens(system.map((s) => s.text ?? '').join(' ')) : 0
    const toolTokens = toolConfig ? estimateTokens(JSON.stringify(toolConfig)) : 0
    // Cap output reservation so it never starves the input budget
    const outputReserve = Math.min(safeMaxTokens, Math.floor(usableContextWindow * 0.5))
    const inputBudget = Math.max(
      512, // absolute minimum so we always send *something*
      usableContextWindow - outputReserve - systemTokens - toolTokens
    )

    logger.info('Context budget calculation', {
      model: modelId,
      contextWindow,
      usableContextWindow,
      safeMaxTokens,
      systemTokens,
      toolTokens,
      inputBudget,
      messageCount: allMessages.length,
    })

    const truncatedMessages = truncateMessages(allMessages, inputBudget)

    try {
      // ── STREAMING (no tools) ───────────────────────────────────────
      if (request.stream && (!providerTools || providerTools.length === 0)) {
        logger.info('Using streaming response for Bedrock request (no tools)')

        const bedrockMessages = toBedrockMessages(truncatedMessages)
        const command = new ConverseStreamCommand({
          modelId,
          messages: bedrockMessages,
          system,
          inferenceConfig: {
            ...(request.temperature !== undefined && { temperature: request.temperature }),
            ...(request.topP !== undefined && { topP: request.topP }),
            maxTokens: safeMaxTokens,
          },
        })

        const streamResponse = await client.send(command)
        const stream = createReadableStreamFromBedrockStream(streamResponse.stream)

        return {
          stream,
          execution: {
            success: true,
            output: {
              content: '',
              model: modelId,
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
              cost: { total: 0, input: 0, output: 0 },
            },
            logs: [],
            metadata: {
              startTime: providerStartTimeISO,
              endTime: new Date().toISOString(),
              duration: Date.now() - providerStartTime,
            },
            isStreaming: true,
          },
        } as StreamingExecution
      }

      // ── NON-STREAMING / TOOL LOOP ─────────────────────────────────
      const bedrockMessages = toBedrockMessages(truncatedMessages)
      const currentMessages = [...bedrockMessages]

      const commandInput: ConverseCommandInput = {
        modelId,
        messages: currentMessages,
        system,
        ...(toolConfig ? { toolConfig } : {}),
        inferenceConfig: {
          ...(request.temperature !== undefined && { temperature: request.temperature }),
          ...(request.topP !== undefined && { topP: request.topP }),
          maxTokens: safeMaxTokens,
        },
      }

      const initialCallTime = Date.now()
      let currentResponse = await client.send(new ConverseCommand(commandInput))
      const firstResponseTime = Date.now() - initialCallTime

      // Extract content
      let content = ''
      const outputContent = currentResponse.output?.message?.content
      if (outputContent) {
        for (const block of outputContent) {
          if (block.text) content += block.text
        }
      }

      const tokens = {
        prompt: currentResponse.usage?.inputTokens || 0,
        completion: currentResponse.usage?.outputTokens || 0,
        total:
          (currentResponse.usage?.inputTokens || 0) + (currentResponse.usage?.outputTokens || 0),
      }

      const toolCalls: any[] = []
      const toolResults: any[] = []
      let iterationCount = 0
      const MAX_ITERATIONS = 10
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

      // Copilot: return tool calls without executing
      if (request.isCopilotRequest) {
        const toolUseBlocks = outputContent?.filter((b: ContentBlock) => b.toolUse) || []
        if (toolUseBlocks.length > 0) {
          logger.info(`Copilot request - returning ${toolUseBlocks.length} tool calls`)
          return {
            content: content || '',
            model: modelId,
            tokens,
            toolCalls: toolUseBlocks.map((b: ContentBlock) => ({
              id: b.toolUse!.toolUseId ?? '',
              name: b.toolUse!.name ?? '',
              arguments: b.toolUse!.input as Record<string, any>,
            })),
          }
        }
      }

      // ── Tool call loop ─────────────────────────────────────────────
      try {
        while (iterationCount < MAX_ITERATIONS) {
          const toolUseBlocks =
            currentResponse.output?.message?.content?.filter((b: ContentBlock) => b.toolUse) || []

          if (toolUseBlocks.length === 0 || currentResponse.stopReason !== 'tool_use') break

          const toolsStartTime = Date.now()

          // Add the full assistant message (text + toolUse blocks)
          currentMessages.push({
            role: 'assistant' as ConversationRole,
            content: currentResponse.output!.message!.content!,
          })

          // Process each tool call
          const toolResultBlocks: ContentBlock[] = []

          for (const block of toolUseBlocks) {
            const tu = block.toolUse!
            const toolName = tu.name!
            const toolArgs = tu.input as Record<string, any>
            const tool = request.tools?.find((t) => t.id === toolName)
            if (!tool) continue

            const toolCallStartTime = Date.now()
            const executionParams = {
              ...tool.params,
              ...toolArgs,
              ...(request.workflowId
                ? {
                    _context: {
                      workflowId: request.workflowId,
                      ...(request.workspaceId ? { workspaceId: request.workspaceId } : {}),
                      ...(request.chatId ? { chatId: request.chatId } : {}),
                    },
                  }
                : {}),
              ...(request.environmentVariables ? { envVars: request.environmentVariables } : {}),
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

            const resultContent = result.success
              ? result.output
              : { error: true, message: result.error || 'Tool execution failed', tool: toolName }

            if (result.success) toolResults.push(result.output)

            toolCalls.push({
              name: toolName,
              arguments: { ...tool.params, ...toolArgs },
              startTime: new Date(toolCallStartTime).toISOString(),
              endTime: new Date(toolCallEndTime).toISOString(),
              duration: toolCallDuration,
              result: resultContent,
              success: result.success,
            })

            toolResultBlocks.push({
              toolResult: {
                toolUseId: tu.toolUseId!,
                content: [{ text: toonEncodeForLLM(resultContent) }] as ToolResultContentBlock[],
              },
            })
          }

          // Add tool results as a user message
          currentMessages.push({
            role: 'user' as ConversationRole,
            content: toolResultBlocks,
          })

          toolsTime += Date.now() - toolsStartTime

          // Next model call
          const nextModelStartTime = Date.now()
          currentResponse = await client.send(
            new ConverseCommand({
              ...commandInput,
              messages: currentMessages,
            })
          )
          const nextModelTime = Date.now() - nextModelStartTime
          modelTime += nextModelTime

          timeSegments.push({
            type: 'model',
            name: `Model response (iteration ${iterationCount + 1})`,
            startTime: nextModelStartTime,
            endTime: nextModelStartTime + nextModelTime,
            duration: nextModelTime,
          })

          // Update content
          const newOutput = currentResponse.output?.message?.content
          if (newOutput) {
            for (const block of newOutput) {
              if (block.text) content = block.text
            }
          }

          // Update tokens
          if (currentResponse.usage) {
            tokens.prompt += currentResponse.usage.inputTokens || 0
            tokens.completion += currentResponse.usage.outputTokens || 0
            tokens.total +=
              (currentResponse.usage.inputTokens || 0) + (currentResponse.usage.outputTokens || 0)
          }

          iterationCount++
        }
      } catch (error) {
        logger.error('Error in Bedrock tool loop:', { error })
      }

      // ── Timing ───────────────────────────────────────────────────────
      const providerEndTime = Date.now()
      const providerEndTimeISO = new Date(providerEndTime).toISOString()
      const totalDuration = providerEndTime - providerStartTime

      // POST-TOOL STREAMING
      if (request.stream && iterationCount > 0) {
        logger.info('Using streaming for final Bedrock response after tool calls')

        const streamCmd = new ConverseStreamCommand({
          modelId,
          messages: currentMessages,
          system,
          inferenceConfig: {
            ...(request.temperature !== undefined && { temperature: request.temperature }),
            maxTokens: safeMaxTokens,
          },
        })

        const streamResponse = await client.send(streamCmd)
        const stream = createReadableStreamFromBedrockStream(streamResponse.stream)

        return {
          stream,
          execution: {
            success: true,
            output: {
              content: '',
              model: modelId,
              tokens,
              toolCalls:
                toolCalls.length > 0 ? { list: toolCalls, count: toolCalls.length } : undefined,
              providerTiming: {
                startTime: providerStartTimeISO,
                endTime: new Date().toISOString(),
                duration: Date.now() - providerStartTime,
                modelTime,
                toolsTime,
                firstResponseTime,
                iterations: iterationCount + 1,
                timeSegments,
              },
              cost: { total: 0, input: 0, output: 0 },
            },
            logs: [],
            metadata: {
              startTime: providerStartTimeISO,
              endTime: new Date().toISOString(),
              duration: Date.now() - providerStartTime,
            },
            isStreaming: true,
          },
        } as StreamingExecution
      }

      return {
        content,
        model: modelId,
        tokens,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        timing: {
          startTime: providerStartTimeISO,
          endTime: providerEndTimeISO,
          duration: totalDuration,
          modelTime,
          toolsTime,
          firstResponseTime,
          iterations: iterationCount + 1,
          timeSegments,
        },
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const isContextOverflow =
        (errorMsg.includes('max_tokens') && errorMsg.includes('at least 1')) ||
        (errorMsg.includes('maximum context length') && errorMsg.includes('input_tokens')) ||
        (errorMsg.includes('context length') && errorMsg.includes('tokens')) ||
        errorMsg.includes('reduce the length of the input')

      // ── Retry with aggressively truncated context ──────────────────
      if (isContextOverflow) {
        logger.warn('Context window exceeded — retrying with aggressively truncated messages', {
          model: modelId,
          originalMessageCount: allMessages.length,
        })

        try {
          // Try to extract the actual context limit AND actual input tokens from the error
          // e.g. "maximum context length is 262144 tokens. However, your request has 308680 input tokens"
          const contextLimitMatch = errorMsg.match(/(\d{3,})\s*tokens\.?\s*However/i)
          const inputTokensMatch = errorMsg.match(/has\s+(\d{3,})\s*input.?tokens/i)
          const actualContextLimit = contextLimitMatch
            ? Number.parseInt(contextLimitMatch[1], 10)
            : getModelContextWindow(modelId)
          const actualInputTokens = inputTokensMatch ? Number.parseInt(inputTokensMatch[1], 10) : 0

          // Keep only the very last user message (most recent turn)
          const lastUserMsg = [...allMessages].reverse().find((m) => m.role === 'user')
          const retryMsg = lastUserMsg || allMessages[allMessages.length - 1]

          // Aggressively cap output tokens and compute a tight input budget
          const retryMaxTokens = Math.min(safeMaxTokens, 1024)
          const retrySystemTokens = system
            ? estimateTokens(system.map((s) => s.text ?? '').join(' '))
            : 0

          // If we know the actual input tokens, calculate exactly how much to cut.
          // Otherwise fall back to 50% of context limit.
          let retryInputBudget: number
          if (actualInputTokens > 0 && actualContextLimit > 0) {
            // We need to fit within: actualContextLimit - retryMaxTokens - retrySystemTokens
            // Apply an extra 20% cut to be safe
            const availableForMessages = actualContextLimit - retryMaxTokens - retrySystemTokens
            const reductionRatio = availableForMessages / actualInputTokens
            // Convert our message to estimated tokens, then apply the ratio
            const msgContent =
              typeof retryMsg.content === 'string'
                ? retryMsg.content
                : JSON.stringify(retryMsg.content ?? '')
            const msgEstimatedTokens = estimateTokens(msgContent)
            retryInputBudget = Math.max(256, Math.floor(msgEstimatedTokens * reductionRatio * 0.8))

            logger.info('Retry using exact reduction from error', {
              actualContextLimit,
              actualInputTokens,
              availableForMessages,
              reductionRatio,
              msgEstimatedTokens,
              retryInputBudget,
            })
          } else {
            retryInputBudget = Math.max(
              256,
              Math.floor(actualContextLimit * 0.5) - retryMaxTokens - retrySystemTokens
            )
            logger.info('Retry using 50% of context limit', {
              actualContextLimit,
              retryInputBudget,
            })
          }

          // Truncate the single message's TEXT to fit
          const truncatedMsg = truncateMessageContent(retryMsg, retryInputBudget)
          // Strip tools from retry to maximise available context for the message
          const retryBedrockMessages = toBedrockMessages([truncatedMsg])

          const retryResponse = await client.send(
            new ConverseCommand({
              modelId,
              messages: retryBedrockMessages,
              system,
              // Omit tools on retry to maximize context budget for the message
              inferenceConfig: {
                ...(request.temperature !== undefined && { temperature: request.temperature }),
                maxTokens: retryMaxTokens,
              },
            })
          )

          let retryContent = ''
          const retryOutput = retryResponse.output?.message?.content
          if (retryOutput) {
            for (const block of retryOutput) {
              if (block.text) retryContent += block.text
            }
          }

          const providerEndTime = Date.now()
          logger.info('Retry with truncated context succeeded', {
            model: modelId,
            contentLength: retryContent.length,
          })

          return {
            content:
              retryContent +
              "\n\n⚠️ Note: The response was generated with reduced context because the full conversation exceeded the model's context window.",
            model: modelId,
            tokens: {
              prompt: retryResponse.usage?.inputTokens || 0,
              completion: retryResponse.usage?.outputTokens || 0,
              total:
                (retryResponse.usage?.inputTokens || 0) + (retryResponse.usage?.outputTokens || 0),
            },
            timing: {
              startTime: providerStartTimeISO,
              endTime: new Date(providerEndTime).toISOString(),
              duration: providerEndTime - providerStartTime,
              modelTime: providerEndTime - providerStartTime,
              toolsTime: 0,
              firstResponseTime: providerEndTime - providerStartTime,
              iterations: 1,
              timeSegments: [],
            },
          }
        } catch (retryError) {
          logger.error('Retry with truncated context also failed', {
            model: modelId,
            error: retryError instanceof Error ? retryError.message : String(retryError),
          })
          // Fall through to the original error handling below
        }
      }

      const providerEndTime = Date.now()
      const providerEndTimeISO = new Date(providerEndTime).toISOString()
      const totalDuration = providerEndTime - providerStartTime

      logger.error('Error in AWS Bedrock request:', { error, duration: totalDuration })

      let userFriendlyMessage = errorMsg
      if (isContextOverflow) {
        userFriendlyMessage =
          "The input is too large for this model's context window even after truncation. " +
          'Please use a model with a larger context window, shorten your prompt, or reduce the number of tools. ' +
          `Original error: ${errorMsg}`
      }

      const enhancedError = new Error(userFriendlyMessage)
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
