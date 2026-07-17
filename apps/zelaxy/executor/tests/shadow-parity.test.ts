/**
 * Exercises the shadow comparison against the real executor: two runs of the same workflow must
 * compare equal, and a changed block output must be reported.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { compareExecutionResults } from '@/lib/execution/shadow-executor'
import { BlockType } from '@/executor/consts'
import { Executor } from '@/executor/index'
import type { ExecutionResult } from '@/executor/types'
import type { SerializedWorkflow } from '@/serializer/types'

function deterministicWorkflow(): SerializedWorkflow {
  return {
    version: '2.0',
    blocks: [
      {
        id: 'start',
        position: { x: 0, y: 0 },
        metadata: { id: BlockType.STARTER, name: 'Start' },
        config: { tool: BlockType.STARTER, params: {} },
        inputs: {},
        outputs: {},
        enabled: true,
      },
      {
        id: 'cond',
        position: { x: 150, y: 0 },
        metadata: { id: BlockType.CONDITION, name: 'Cond' },
        config: {
          tool: BlockType.CONDITION,
          params: {
            conditions: JSON.stringify([{ id: 'c1', expression: 'true', blockId: 'cond' }]),
          },
        },
        inputs: {},
        outputs: {},
        enabled: true,
      },
    ],
    connections: [{ source: 'start', target: 'cond' }],
    loops: {},
    parallels: {},
  } as SerializedWorkflow
}

const run = (): Promise<ExecutionResult> =>
  new Executor({
    workflow: deterministicWorkflow(),
    contextExtensions: { executionId: `e-${Math.random()}` },
  }).execute('wf') as Promise<ExecutionResult>

describe('shadow parity against the real executor', () => {
  it('two runs of the same workflow do not diverge', async () => {
    const a = await run()
    const b = await run()

    const report = compareExecutionResults(a, b)
    expect(report.divergent).toBe(false)
    expect(report.differences).toEqual([])
  })

  it('detects a changed output on a real result', async () => {
    const a = await run()

    // A shadow engine that produced a different final output must be flagged.
    const perturbed: ExecutionResult = {
      ...a,
      output: { ...(a.output as object), injected: 'divergent' },
    }

    const report = compareExecutionResults(a, perturbed)
    expect(report.divergent).toBe(true)
    expect(report.differences.some((d) => d.path.includes('injected'))).toBe(true)
  })

  it('detects a changed success flag on a real result', async () => {
    const a = await run()
    const report = compareExecutionResults(a, { ...a, success: !a.success })
    expect(report.divergent).toBe(true)
    expect(report.differences.some((d) => d.path === 'success')).toBe(true)
  })
})
