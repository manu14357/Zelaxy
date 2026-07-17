/**
 * End-to-end proof that human-in-the-loop and async-wait blocks actually pause the run and can be
 * resumed — the behaviour that was silently broken (the executor ran straight through the gate).
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { deserializeContext } from '@/lib/execution/context-serializer'
import { BlockType } from '@/executor/consts'
import { Executor } from '@/executor/index'
import type { SerializedWorkflow } from '@/serializer/types'

function workflowWith(gate: 'human' | 'wait'): SerializedWorkflow {
  const gateBlock =
    gate === 'human'
      ? {
          id: 'gate',
          position: { x: 150, y: 0 },
          metadata: { id: BlockType.HUMAN_IN_THE_LOOP, name: 'Approve' },
          config: { tool: BlockType.HUMAN_IN_THE_LOOP, params: { title: 'Approve?' } },
          inputs: {},
          outputs: {},
          enabled: true,
        }
      : {
          id: 'gate',
          position: { x: 150, y: 0 },
          metadata: { id: BlockType.WAIT, name: 'Wait' },
          config: {
            tool: BlockType.WAIT,
            params: { async: true, timeValue: '1', timeUnitLong: 'days' },
          },
          inputs: {},
          outputs: {},
          enabled: true,
        }

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
      gateBlock as any,
      {
        // A short SYNC wait runs entirely in-process (no external API), so the test proves the
        // downstream block executes on resume without depending on the function-execute service.
        id: 'after',
        position: { x: 300, y: 0 },
        metadata: { id: BlockType.WAIT, name: 'After' },
        config: { tool: BlockType.WAIT, params: { timeValue: '0.01', timeUnit: 'seconds' } },
        inputs: {},
        outputs: {},
        enabled: true,
      },
    ],
    connections: [
      { source: 'start', target: 'gate' },
      { source: 'gate', target: 'after' },
    ],
    loops: {},
    parallels: {},
  } as SerializedWorkflow
}

describe('pause / resume', () => {
  let executor: Executor

  beforeEach(() => {
    executor = new Executor({
      workflow: workflowWith('human'),
      contextExtensions: { executionId: 'exec-test' },
    })
  })

  it('halts at a human-in-the-loop gate instead of running the downstream block', async () => {
    const result = (await executor.execute('wf-test')) as any

    // The critical regression: 'after' must NOT have run.
    expect(result.paused).toBeDefined()
    expect(result.paused.pauseKind).toBe('human-in-the-loop')
    expect(result.paused.blockId).toBe('gate')
    expect(result.success).toBe(false)

    // The downstream block did not execute (its output would say "ran after gate")
    const restored = deserializeContext(result.paused.snapshot)
    expect(restored.executedBlocks.has('after')).toBe(false)
    expect(restored.executedBlocks.has('gate')).toBe(true)
  })

  it('resumes past the gate when approved and runs the downstream block', async () => {
    const paused = (await executor.execute('wf-test')) as any
    const context = deserializeContext(paused.paused.snapshot)

    // A fresh executor over the same workflow resumes from the snapshot — this is what the resume
    // API does on a possibly-different instance.
    const resumeExecutor = new Executor({
      workflow: workflowWith('human'),
      contextExtensions: { executionId: 'exec-test' },
    })
    const result = await resumeExecutor.resumeFromPause(context, 'gate', { approved: true })

    expect(result.success).toBe(true)
    expect(result.paused).toBeUndefined()
    // 'after' ran this time
    expect(context.executedBlocks.has('after')).toBe(true)
  })

  it('the resumed gate output carries the human decision to downstream blocks', async () => {
    const paused = (await executor.execute('wf-test')) as any
    const context = deserializeContext(paused.paused.snapshot)

    const resumeExecutor = new Executor({
      workflow: workflowWith('human'),
      contextExtensions: { executionId: 'exec-test' },
    })
    await resumeExecutor.resumeFromPause(context, 'gate', { approved: false, note: 'denied' })

    const gateOutput = context.blockStates.get('gate')?.output as any
    expect(gateOutput.approved).toBe(false)
    expect(gateOutput.note).toBe('denied')
    expect(gateOutput.status).toBe('completed')
  })

  it('an async wait halts with a resumeAt timestamp instead of continuing immediately', async () => {
    const waitExecutor = new Executor({
      workflow: workflowWith('wait'),
      contextExtensions: { executionId: 'exec-wait' },
    })
    const result = (await waitExecutor.execute('wf-wait')) as any

    expect(result.paused).toBeDefined()
    expect(result.paused.pauseKind).toBe('time')
    expect(result.paused.resumeAt).toBeTruthy()
    // resumeAt is ~1 day out, definitively in the future
    expect(new Date(result.paused.resumeAt).getTime()).toBeGreaterThan(Date.now())
  })
})
