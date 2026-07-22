import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type {
  BlockHandler,
  ExecutionContext,
  NormalizedBlockOutput,
  StreamingExecution,
} from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('ZelaxyArenaBlockHandler')

const MAX_ZELAXY_ARENA_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ZELAXY_ARENA_EXECUTE_STREAM_HEADER = 'X-ZelaxyArena-Execute-Stream'
const ZELAXY_ARENA_EXECUTE_STREAM_VALUE = 'ndjson'

type ZelaxyArenaExecuteResult = {
  content?: string
  model?: string
  conversationId?: string
  tokens?: Record<string, unknown>
  toolCalls?: Array<Record<string, unknown>>
  cost?: unknown
}

type ZelaxyArenaStreamEvent =
  | { type: 'heartbeat'; timestamp?: string }
  | { type: 'chunk'; content?: string }
  | { type: 'final'; data: ZelaxyArenaExecuteResult }
  | { type: 'error'; error?: string }

function parseStreamLine(line: string): ZelaxyArenaStreamEvent | undefined {
  const trimmed = line.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed) as ZelaxyArenaStreamEvent
  } catch {
    throw new Error('ZelaxyArena execution stream returned malformed data')
  }
}

function formatOutput(result: ZelaxyArenaExecuteResult, fallbackId: string): NormalizedBlockOutput {
  const formattedList = (result.toolCalls ?? []).map((tc) => ({
    name: typeof tc.name === 'string' ? tc.name : String(tc.name ?? ''),
    arguments: (tc.params && typeof tc.params === 'object' ? tc.params : {}) as Record<
      string,
      unknown
    >,
    result: tc.result as any,
    error: typeof tc.error === 'string' ? tc.error : undefined,
    duration: typeof tc.durationMs === 'number' ? tc.durationMs : 0,
  }))

  return {
    content: result.content ?? '',
    model: result.model ?? 'zelaxy-arena',
    conversationId: result.conversationId ?? fallbackId,
    tokens: (result.tokens ?? {}) as NormalizedBlockOutput['tokens'],
    toolCalls: { list: formattedList, count: formattedList.length },
    cost: result.cost as NormalizedBlockOutput['cost'],
  }
}

function isContentSelectedForStreaming(ctx: ExecutionContext, block: SerializedBlock): boolean {
  if (!ctx.stream) return false
  return (
    ctx.selectedOutputIds?.some(
      (id) => id === block.id || id === `${block.id}.content` || id === `${block.id}_content`
    ) ?? false
  )
}

async function buildZelaxyArenaUrl(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base}/api/zelaxy-arena/execute`
}

async function buildZelaxyArenaHeaders(ctx: ExecutionContext): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (ctx.userId) {
    // Use internal service token if available
    const serviceToken = process.env.INTERNAL_SERVICE_TOKEN
    if (serviceToken) headers.Authorization = `Bearer ${serviceToken}`
  }
  return headers
}

async function readFullResponse(response: Response): Promise<ZelaxyArenaExecuteResult> {
  if (!response.body) throw new Error('ZelaxyArena stream ended with no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: ZelaxyArenaExecuteResult = {}

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const event = parseStreamLine(line)
        if (!event) continue
        if (event.type === 'final') result = event.data
        if (event.type === 'error')
          throw new Error(`ZelaxyArena error: ${event.error ?? 'Unknown'}`)
      }
    }
    if (buffer.trim()) {
      const event = parseStreamLine(buffer)
      if (event?.type === 'final') result = event.data
    }
  } finally {
    reader.releaseLock()
  }

  return result
}

function buildStreamingExecution(
  response: Response,
  fallbackId: string,
  blockId: string
): StreamingExecution {
  if (!response.body) throw new Error('ZelaxyArena stream ended with no body')

  const output = formatOutput({}, fallbackId)
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = response.body!.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      let buffer = ''
      let sawFinal = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const event = parseStreamLine(line)
            if (!event) continue
            if (event.type === 'heartbeat') continue
            if (event.type === 'chunk' && event.content) {
              controller.enqueue(encoder.encode(event.content))
            } else if (event.type === 'final') {
              sawFinal = true
              Object.assign(output, formatOutput(event.data, fallbackId))
            } else if (event.type === 'error') {
              throw new Error(`ZelaxyArena error: ${event.error ?? 'Unknown'}`)
            }
          }
        }

        if (buffer.trim()) {
          const event = parseStreamLine(buffer)
          if (event?.type === 'final') {
            sawFinal = true
            Object.assign(output, formatOutput(event.data, fallbackId))
          }
        }

        if (!sawFinal) throw new Error('ZelaxyArena stream ended without a final result')
        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader?.releaseLock()
      }
    },
    cancel(reason) {
      return reader?.cancel(reason)
    },
  })

  return {
    stream,
    execution: {
      success: true,
      output,
      logs: [],
      metadata: { duration: 0, startTime: new Date().toISOString() },
      isStreaming: true,
    } as any,
  }
}

export class ZelaxyArenaBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.ZELAXY_ARENA
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    ctx: ExecutionContext
  ): Promise<any> {
    const conversationId = (inputs.conversationId as string | undefined) ?? crypto.randomUUID()
    const url = await buildZelaxyArenaUrl()
    const headers = await buildZelaxyArenaHeaders(ctx)
    const shouldStream = isContentSelectedForStreaming(ctx, block)

    const requestBody = {
      conversationId,
      messages: inputs.messages ?? [],
      model: inputs.model,
      systemPrompt: inputs.systemPrompt,
      tools: inputs.tools,
      temperature: inputs.temperature,
      // maxTokens is a free-text field, so the resolved value arrives as a raw string — coerce it to
      // a real number here. The execute route only accepts `typeof maxTokens === 'number'` and
      // silently falls back to the default otherwise, so an uncoerced string here made this field a
      // no-op regardless of what the user configured.
      maxTokens:
        inputs.maxTokens != null && Number(inputs.maxTokens) >= 1
          ? Math.round(Number(inputs.maxTokens))
          : undefined,
      // Pass workspace context so the block runs as the FULL ZelaxyArena agent (tools + snapshot),
      // not a bare LLM call — matching what the chat agent can do.
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    }

    if (shouldStream) {
      headers[ZELAXY_ARENA_EXECUTE_STREAM_HEADER] = ZELAXY_ARENA_EXECUTE_STREAM_VALUE
    }

    logger.info('ZelaxyArena block executing', { blockId: block.id, conversationId, shouldStream })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`ZelaxyArena API error (${response.status}): ${errorText}`)
    }

    if (shouldStream) {
      return buildStreamingExecution(response, conversationId, block.id)
    }

    const result = await readFullResponse(response)
    return formatOutput(result, conversationId)
  }
}
