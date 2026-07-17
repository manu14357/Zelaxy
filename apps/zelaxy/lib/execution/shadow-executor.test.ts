import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import type { ExecutionResult } from '@/executor/types'
import { compareExecutionResults, normalizeResult } from './shadow-executor'

function result(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    success: true,
    output: { value: 42 },
    logs: [
      {
        blockId: 'a',
        blockType: 'function',
        success: true,
        output: { result: 'x' },
        startedAt: '2024-01-01T00:00:00Z',
        endedAt: '2024-01-01T00:00:01Z',
        durationMs: 1000,
      },
    ],
    metadata: {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-01T00:00:05Z',
      duration: 5000,
    },
    ...overrides,
  } as ExecutionResult
}

describe('compareExecutionResults', () => {
  it('identical results do not diverge', () => {
    expect(compareExecutionResults(result(), result()).divergent).toBe(false)
  })

  it('run-to-run timing differences do not count as divergence', () => {
    // The whole point: the same run at a different wall-clock time must compare equal.
    const a = result({
      metadata: {
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-01T00:00:05Z',
        duration: 5000,
      },
    })
    const b = result({
      metadata: {
        startTime: '2025-06-01T12:00:00Z',
        endTime: '2025-06-01T12:00:09Z',
        duration: 9000,
      },
    })
    expect(compareExecutionResults(a, b).divergent).toBe(false)
  })

  it('per-block timing differences do not count as divergence', () => {
    const a = result()
    const b = result({
      logs: [
        {
          blockId: 'a',
          blockType: 'function',
          success: true,
          output: { result: 'x' },
          startedAt: '2030-01-01T00:00:00Z',
          endedAt: '2030-01-01T00:02:00Z',
          durationMs: 120000,
        },
      ] as any,
    })
    expect(compareExecutionResults(a, b).divergent).toBe(false)
  })

  it('log ORDER does not matter — blocks are compared by id', () => {
    const twoBlocks = (order: 'ab' | 'ba') =>
      result({
        logs: (order === 'ab'
          ? [
              { blockId: 'a', success: true, output: 1, startedAt: '', endedAt: '', durationMs: 0 },
              { blockId: 'b', success: true, output: 2, startedAt: '', endedAt: '', durationMs: 0 },
            ]
          : [
              { blockId: 'b', success: true, output: 2, startedAt: '', endedAt: '', durationMs: 0 },
              { blockId: 'a', success: true, output: 1, startedAt: '', endedAt: '', durationMs: 0 },
            ]) as any,
      })
    // Two engines may schedule ready blocks in different order yet reach the same state.
    expect(compareExecutionResults(twoBlocks('ab'), twoBlocks('ba')).divergent).toBe(false)
  })

  it('a different final output diverges and pinpoints the path', () => {
    const report = compareExecutionResults(result(), result({ output: { value: 43 } }))
    expect(report.divergent).toBe(true)
    expect(report.differences).toContainEqual({ path: 'output.value', primary: 42, shadow: 43 })
  })

  it('a different block output diverges', () => {
    const report = compareExecutionResults(
      result(),
      result({
        logs: [
          {
            blockId: 'a',
            blockType: 'function',
            success: true,
            output: { result: 'DIFFERENT' },
            startedAt: '',
            endedAt: '',
            durationMs: 0,
          },
        ] as any,
      })
    )
    expect(report.divergent).toBe(true)
    expect(report.differences.some((d) => d.path.startsWith('blocks.a'))).toBe(true)
  })

  it('a different success flag diverges', () => {
    const report = compareExecutionResults(result(), result({ success: false, error: 'boom' }))
    expect(report.divergent).toBe(true)
    expect(report.differences.some((d) => d.path === 'success')).toBe(true)
  })

  it('a missing block on one side diverges', () => {
    const withExtra = result({
      logs: [
        { blockId: 'a', success: true, output: 1, startedAt: '', endedAt: '', durationMs: 0 },
        { blockId: 'b', success: true, output: 2, startedAt: '', endedAt: '', durationMs: 0 },
      ] as any,
    })
    expect(compareExecutionResults(result(), withExtra).divergent).toBe(true)
  })

  it('a divergent pause point is reported', () => {
    const paused = result({
      success: false,
      paused: { contextId: 'c', blockId: 'gate', pauseKind: 'human-in-the-loop', snapshot: '{}' },
    })
    expect(compareExecutionResults(result(), paused).divergent).toBe(true)
  })
})

describe('normalizeResult', () => {
  it('drops volatile metadata and log timing but keeps deterministic core', () => {
    const n = normalizeResult(result()) as any
    expect(n.metadata.startTime).toBeUndefined()
    expect(n.metadata.duration).toBeUndefined()
    expect(n.blocks.a.durationMs).toBeUndefined()
    expect(n.blocks.a.output).toEqual({ result: 'x' })
    expect(n.success).toBe(true)
    expect(n.output).toEqual({ value: 42 })
  })
})
