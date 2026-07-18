/**
 * End-to-end loop tests for the DAG executor: the sentinel/orchestrator model must iterate the loop
 * body the configured number of times and then run the post-loop block exactly once.
 *
 * @vitest-environment node
 */
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

vi.mock('@/tools', () => ({ executeTool: vi.fn() }))

import { BlockType } from '@/executor/consts'
import { DAGExecutor } from '@/executor/execution/executor'
import type { ExecutionResult } from '@/executor/types'
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

const run = (wf: SerializedWorkflow): Promise<ExecutionResult> =>
  new DAGExecutor({ workflow: wf, workflowInput: {}, contextExtensions: {} }).execute('wf')

const count = (result: ExecutionResult, blockId: string) =>
  (result.logs ?? []).filter((l) => l.blockId === blockId).length

describe('DAGExecutor — loops', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteTool.mockImplementation(async (_tool: string, params: any) => {
      const n = Number(/return\s+(\d+)/.exec(params.code ?? '')?.[1] ?? 0)
      return { success: true, output: { result: n, stdout: '' } }
    })
  })

  it('runs a `for` loop body N times then the post-loop block once', async () => {
    const wf: SerializedWorkflow = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('loop1', BlockType.LOOP),
        block('body', BlockType.FUNCTION, { code: 'return 1' }),
        block('after', BlockType.FUNCTION, { code: 'return 9' }),
      ],
      connections: [
        { source: 'start', target: 'loop1' },
        { source: 'loop1', target: 'body', sourceHandle: 'loop-start-source' },
        { source: 'loop1', target: 'after', sourceHandle: 'loop-end-source' },
      ],
      loops: { loop1: { id: 'loop1', nodes: ['body'], iterations: 3, loopType: 'for' } },
      parallels: {},
    } as SerializedWorkflow

    const result = await run(wf)

    expect(result.success).toBe(true)
    expect(count(result, 'body')).toBe(3)
    expect(count(result, 'after')).toBe(1)
    expect(result.output.result).toBe(9)
  })

  it('runs a `forEach` loop once per item then the post-loop block once', async () => {
    const wf: SerializedWorkflow = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('loop1', BlockType.LOOP),
        block('body', BlockType.FUNCTION, { code: 'return 1' }),
        block('after', BlockType.FUNCTION, { code: 'return 9' }),
      ],
      connections: [
        { source: 'start', target: 'loop1' },
        { source: 'loop1', target: 'body', sourceHandle: 'loop-start-source' },
        { source: 'loop1', target: 'after', sourceHandle: 'loop-end-source' },
      ],
      loops: {
        loop1: {
          id: 'loop1',
          nodes: ['body'],
          iterations: 5,
          loopType: 'forEach',
          forEachItems: [10, 20, 30, 40],
        },
      },
      parallels: {},
    } as SerializedWorkflow

    const result = await run(wf)

    expect(result.success).toBe(true)
    expect(count(result, 'body')).toBe(4)
    expect(count(result, 'after')).toBe(1)
  })
})
