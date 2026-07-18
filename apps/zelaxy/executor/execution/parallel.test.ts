/**
 * End-to-end parallel tests for the DAG executor: a parallel's single-branch template must expand to
 * one branch per distribution item, run each branch, then run the post-parallel block once.
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

describe('DAGExecutor — parallel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteTool.mockImplementation(async (_tool: string, params: any) => {
      const n = Number(/return\s+(\d+)/.exec(params.code ?? '')?.[1] ?? 0)
      return { success: true, output: { result: n, stdout: '' } }
    })
  })

  it('runs one branch per distribution item, then the post-parallel block once', async () => {
    const wf: SerializedWorkflow = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('par1', BlockType.PARALLEL),
        block('body', BlockType.FUNCTION, { code: 'return 7' }),
        block('after', BlockType.FUNCTION, { code: 'return 9' }),
      ],
      connections: [
        { source: 'start', target: 'par1' },
        { source: 'par1', target: 'body', sourceHandle: 'parallel-start-source' },
        { source: 'par1', target: 'after', sourceHandle: 'parallel-end-source' },
      ],
      loops: {},
      parallels: { par1: { id: 'par1', nodes: ['body'], distribution: [10, 20, 30] } },
    } as unknown as SerializedWorkflow

    const result = await run(wf)

    expect(result.success).toBe(true)
    const bodyRuns = (result.logs ?? []).filter((l) => l.blockId?.startsWith('body'))
    expect(bodyRuns.length).toBe(3)
    // each branch gets a distinct virtual id
    expect(new Set(bodyRuns.map((l) => l.blockId)).size).toBe(3)
    expect((result.logs ?? []).filter((l) => l.blockId === 'after').length).toBe(1)
    expect(result.output.result).toBe(9)
  })
})
