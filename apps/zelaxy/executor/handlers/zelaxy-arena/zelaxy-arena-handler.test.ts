/**
 * Functional tests for the ZelaxyArena block handler.
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockType } from '@/executor/consts'
import { ZelaxyArenaBlockHandler } from '@/executor/handlers/zelaxy-arena/zelaxy-arena-handler'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

/** Build a mock Response whose body streams the given NDJSON lines. */
function ndjsonResponse(lines: string[], ok = true, status = 200): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      for (const line of lines) controller.enqueue(enc.encode(`${line}\n`))
      controller.close()
    },
  })
  return {
    ok,
    status,
    body,
    statusText: 'OK',
    text: async () => lines.join('\n'),
  } as unknown as Response
}

describe('ZelaxyArenaBlockHandler', () => {
  const handler = new ZelaxyArenaBlockHandler()
  const block = { id: 'za-1', metadata: { id: BlockType.ZELAXY_ARENA } } as SerializedBlock
  const ctx = { workspaceId: 'ws-1', userId: 'user-1' } as ExecutionContext
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = fetchMock as unknown as typeof fetch
  })
  afterEach(() => vi.restoreAllMocks())

  it('handles only zelaxy-arena blocks', () => {
    expect(handler.canHandle(block)).toBe(true)
    expect(handler.canHandle({ metadata: { id: 'other' } } as SerializedBlock)).toBe(false)
  })

  it('builds the request from inputs and returns the formatted final result', async () => {
    fetchMock.mockResolvedValue(
      ndjsonResponse([
        JSON.stringify({ type: 'heartbeat' }),
        JSON.stringify({
          type: 'final',
          data: { content: 'hello', model: 'mimo-v2.5-pro', tokens: { total: 5 }, toolCalls: [] },
        }),
      ])
    )

    const out: any = await handler.execute(
      block,
      {
        model: 'mimo-v2.5-pro',
        systemPrompt: 'be nice',
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 0.5,
        maxTokens: 100,
        conversationId: 'conv-1',
      },
      ctx
    )

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/api/zelaxy-arena/execute')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('mimo-v2.5-pro')
    expect(body.systemPrompt).toBe('be nice')
    expect(body.conversationId).toBe('conv-1')
    expect(body.temperature).toBe(0.5)
    expect(body.maxTokens).toBe(100)
    expect(body.workspaceId).toBe('ws-1')
    expect(body.userId).toBe('user-1')

    expect(out.content).toBe('hello')
    expect(out.model).toBe('mimo-v2.5-pro')
    expect(out.conversationId).toBe('conv-1')
    expect(out.toolCalls).toEqual({ list: [], count: 0 })
  })

  it('defaults the conversationId when not provided', async () => {
    fetchMock.mockResolvedValue(
      ndjsonResponse([JSON.stringify({ type: 'final', data: { content: 'x' } })])
    )
    const out: any = await handler.execute(block, { model: 'm', messages: [] }, ctx)
    expect(typeof out.conversationId).toBe('string')
    expect(out.conversationId.length).toBeGreaterThan(0)
  })

  it('throws on a non-ok API response', async () => {
    fetchMock.mockResolvedValue(ndjsonResponse(['boom'], false, 500))
    await expect(handler.execute(block, { model: 'm', messages: [] }, ctx)).rejects.toThrow(
      /ZelaxyArena API error \(500\)/
    )
  })
})
