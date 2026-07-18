/**
 * Nested subflow execution on the DAG path: a loop inside a loop must run the inner body
 * (outer × inner) times and the post-loop block once. This exercises the orchestrator's loop-edge
 * restoration and nested-scope reset.
 *
 * @vitest-environment node
 */
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: string[] = []

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/tools', () => ({
  executeTool: vi.fn(async (_tool: string, params: any) => {
    calls.push(params.code ?? '')
    return { success: true, output: { result: 0, stdout: '' } }
  }),
}))

import { BlockType } from '@/executor/consts'
import { DAGExecutor } from '@/executor/execution/executor'
import type { SerializedWorkflow } from '@/serializer/types'
import { executeTool } from '@/tools'

const mockExecuteTool = executeTool as Mock

function block(id: string, type: any, params: any = {}) {
  return {
    id,
    position: { x: 0, y: 0 },
    metadata: { id: type, name: id },
    config: { tool: type, params },
    inputs: {},
    outputs: {},
    enabled: true,
  }
}

function nestedLoopWorkflow(outer: number, inner: number): SerializedWorkflow {
  return {
    version: '2.0',
    blocks: [
      block('start', BlockType.STARTER),
      block('L1', BlockType.LOOP),
      block('L2', BlockType.LOOP),
      block('body', BlockType.FUNCTION, { code: 'return BODY' }),
      block('after', BlockType.FUNCTION, { code: 'return AFTER' }),
    ],
    connections: [
      { source: 'start', target: 'L1' },
      { source: 'L1', target: 'L2', sourceHandle: 'loop-start-source' },
      { source: 'L1', target: 'after', sourceHandle: 'loop-end-source' },
      { source: 'L2', target: 'body', sourceHandle: 'loop-start-source' },
    ],
    loops: {
      L1: { id: 'L1', nodes: ['L2', 'body'], iterations: outer, loopType: 'for' },
      L2: { id: 'L2', nodes: ['body'], iterations: inner, loopType: 'for' },
    },
    parallels: {},
  } as unknown as SerializedWorkflow
}

const run = (wf: SerializedWorkflow) =>
  new DAGExecutor({ workflow: wf, workflowInput: {}, contextExtensions: {} }).execute('wf')

describe('DAGExecutor — nested loops', () => {
  beforeEach(() => {
    calls.length = 0
    mockExecuteTool.mockClear()
  })

  it.each([
    [2, 3],
    [3, 2],
    [1, 4],
    [4, 1],
    [3, 3],
  ])('runs a %ix%i loop-in-loop the right number of times', async (outer, inner) => {
    const result = await run(nestedLoopWorkflow(outer, inner))

    expect(result.success).toBe(true)
    const bodyRuns = calls.filter((c) => c.includes('BODY')).length
    const afterRuns = calls.filter((c) => c.includes('AFTER')).length
    expect(bodyRuns).toBe(outer * inner)
    expect(afterRuns).toBe(1)
  })
})
