import { describe, expect, it } from 'vitest'
import type { ExecutionContext } from '@/executor/types'
import { deserializeContext, serializeContext, unsupportedPauseReason } from './context-serializer'

function baseContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    workflowId: 'wf-1',
    executionId: 'exec-1',
    blockStates: new Map([['block-a', { output: { value: 42 }, executed: true } as any]]),
    blockLogs: [],
    metadata: { startTime: '2024-01-01T00:00:00Z', duration: 0 } as any,
    environmentVariables: { KEY: 'value' },
    decisions: {
      router: new Map([['router-1', 'target-1']]),
      condition: new Map([['cond-1', 'branch-a']]),
    },
    loopIterations: new Map(),
    loopItems: new Map(),
    completedLoops: new Set(['loop-done']),
    executedBlocks: new Set(['block-a']),
    activeExecutionPath: new Set(['block-b']),
    ...overrides,
  } as ExecutionContext
}

describe('context serializer', () => {
  it('round-trips top-level Maps and Sets', () => {
    const ctx = baseContext()
    const restored = deserializeContext(serializeContext(ctx))

    expect(restored.blockStates).toBeInstanceOf(Map)
    expect(restored.blockStates.get('block-a')).toEqual({ output: { value: 42 }, executed: true })
    expect(restored.executedBlocks).toBeInstanceOf(Set)
    expect(restored.executedBlocks.has('block-a')).toBe(true)
    expect(restored.completedLoops.has('loop-done')).toBe(true)
    expect(restored.decisions.router).toBeInstanceOf(Map)
    expect(restored.decisions.router.get('router-1')).toBe('target-1')
  })

  it('round-trips Maps nested inside Map values', () => {
    const ctx = baseContext({
      parallelExecutions: new Map([
        [
          'par-1',
          {
            parallelCount: 2,
            distributionItems: ['x', 'y'],
            completedExecutions: 1,
            executionResults: new Map([['iteration_0', { ok: true }]]),
            activeIterations: new Set([1]),
            currentIteration: 1,
          },
        ],
      ]) as any,
    })

    const restored = deserializeContext(serializeContext(ctx))
    const par = restored.parallelExecutions!.get('par-1') as any

    expect(par.executionResults).toBeInstanceOf(Map)
    expect(par.executionResults.get('iteration_0')).toEqual({ ok: true })
    expect(par.activeIterations).toBeInstanceOf(Set)
    expect(par.activeIterations.has(1)).toBe(true)
  })

  it('drops callbacks rather than persisting them', () => {
    const ctx = baseContext({
      onStream: (async () => 'x') as any,
      pauseExecution: (async () => {}) as any,
    })
    const json = serializeContext(ctx)

    expect(json).not.toContain('onStream')
    expect(json).not.toContain('pauseExecution')
    const restored = deserializeContext(json)
    expect(restored.onStream).toBeUndefined()
  })

  it('preserves ordinary nested objects and arrays', () => {
    const ctx = baseContext({
      blockLogs: [{ blockId: 'b', success: true, nested: { a: [1, 2, 3] } }] as any,
    })
    const restored = deserializeContext(serializeContext(ctx))
    expect(restored.blockLogs[0]).toEqual({ blockId: 'b', success: true, nested: { a: [1, 2, 3] } })
  })
})

describe('unsupportedPauseReason', () => {
  it('allows a linear pause', () => {
    expect(unsupportedPauseReason(baseContext())).toBeNull()
  })

  it('rejects a pause inside an active parallel', () => {
    const ctx = baseContext({ parallelExecutions: new Map([['p', {} as any]]) })
    expect(unsupportedPauseReason(ctx)).toMatch(/parallel/i)
  })

  it('rejects a pause inside an active loop', () => {
    const ctx = baseContext({ loopExecutions: new Map([['l', {} as any]]) })
    expect(unsupportedPauseReason(ctx)).toMatch(/loop/i)
  })
})
