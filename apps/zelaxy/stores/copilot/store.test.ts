import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/copilot/api', () => ({
  sendDirectMessage: vi.fn(),
  sendStreamingMessage: vi.fn(),
}))

vi.mock('@/lib/copilot/tools', () => ({
  toolRegistry: {
    requiresInterrupt: (toolId: string) => toolId === 'run_workflow',
    getTool: () => undefined,
    getServerToolMetadata: () => undefined,
  },
}))

import { reconcileStuckToolCalls, sseHandlers } from './store'

function toolCall(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    id: 'tc-1',
    name: 'build_workflow',
    state: 'executing',
    startTime: Date.now(),
    ...overrides,
  }
}

describe('reconcileStuckToolCalls', () => {
  it('promotes a tool call stuck "executing" with a result to "success"', () => {
    const tc = toolCall({ result: { yamlContent: 'blocks: {}' } })
    const toolCalls = [tc]
    reconcileStuckToolCalls(toolCalls, [])
    expect(toolCalls[0].state).toBe('success')
    // The array element must be a genuinely NEW object, not the same mutated reference — a
    // memoized message component comparing toolCalls by reference (or reading .state off
    // whatever object it was last given) can silently miss an in-place mutation, since
    // "previous" and "next" would otherwise point at the identical object.
    expect(toolCalls[0]).not.toBe(tc)
  })

  it('marks a tool call stuck "executing" with no result as "errored" instead of leaving it stuck', () => {
    const tc = toolCall()
    const toolCalls = [tc]
    reconcileStuckToolCalls(toolCalls, [])
    expect(toolCalls[0].state).toBe('errored')
    expect(toolCalls[0].error).toContain('No result received')
  })

  it('does not touch an interrupt-requiring tool sitting in "pending" (awaiting user Run/Skip)', () => {
    const tc = toolCall({ name: 'run_workflow', state: 'pending' })
    reconcileStuckToolCalls([tc], [])
    expect(tc.state).toBe('pending')
  })

  it('does not touch a tool call already moved to "background"', () => {
    const tc = toolCall({ state: 'background' })
    reconcileStuckToolCalls([tc], [])
    expect(tc.state).toBe('background')
  })

  it('does not touch a tool call already in a terminal state', () => {
    const tc = toolCall({ state: 'success', result: { ok: true } })
    reconcileStuckToolCalls([tc], [])
    expect(tc.state).toBe('success')
  })

  it('keeps the contentBlocks copy of the tool call in sync with the reconciled one', () => {
    const tc = toolCall({ result: { ok: true } })
    const contentBlocks = [{ type: 'tool_call', toolCall: tc }]
    const toolCalls = [tc]
    reconcileStuckToolCalls(toolCalls, contentBlocks)
    expect(contentBlocks[0].toolCall.state).toBe('success')
  })
})

describe('sseHandlers.tool_result', () => {
  // updateStreamingMessage (called at the end of every SSE handler) schedules its store commit via
  // requestAnimationFrame, which doesn't exist in this node test environment — stub it to run the
  // callback synchronously so we can assert on the queued update.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })

  function context(tc: Record<string, any>) {
    const block = { type: 'tool_call', toolCall: tc, timestamp: Date.now() }
    return {
      toolCalls: [tc],
      contentBlocks: [block],
    } as any
  }

  it('updates the tool call to a new object reference on success, not an in-place mutation', () => {
    const tc = toolCall()
    const ctx = context(tc)
    const originalContentBlock = ctx.contentBlocks[0]

    sseHandlers.tool_result(
      { toolCallId: 'tc-1', result: JSON.stringify({ blocksCount: 3 }), success: true },
      ctx,
      (() => ({})) as any,
      () => {}
    )

    expect(ctx.toolCalls[0].state).toBe('success')
    expect(ctx.toolCalls[0]).not.toBe(tc)
    // The contentBlocks entry must also be replaced, not just its nested .toolCall mutated.
    expect(ctx.contentBlocks[0]).not.toBe(originalContentBlock)
    expect(ctx.contentBlocks[0].toolCall.state).toBe('success')
  })

  it('updates the tool call to "errored" on failure without mutating the original reference', () => {
    const tc = toolCall()
    const ctx = context(tc)

    sseHandlers.tool_result(
      { toolCallId: 'tc-1', result: null, success: false, error: 'boom' },
      ctx,
      (() => ({})) as any,
      () => {}
    )

    expect(ctx.toolCalls[0].state).toBe('errored')
    expect(ctx.toolCalls[0]).not.toBe(tc)
    // The original object passed in must be untouched (proves this is a real clone, not a mutation
    // that merely got copied afterward).
    expect(tc.state).toBe('executing')
  })
})
