/**
 * Entry-point resolution: a manual run (no trigger id) must start from the manual starter even when
 * the workflow also has a schedule/webhook trigger listed first; a triggered run must start from the
 * given trigger. All three resolvers (DAG reachable set, engine queue, start-block seed) must agree,
 * otherwise the run "succeeds" having executed nothing.
 *
 * @vitest-environment node
 */
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ran: string[] = []

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/tools', () => ({
  executeTool: vi.fn(async (_tool: string, params: any) => {
    ran.push(params.code ?? '')
    return { success: true, output: { result: 1, stdout: '' } }
  }),
}))

import { BlockType } from '@/executor/consts'
import { DAGExecutor } from '@/executor/execution/executor'
import type { SerializedWorkflow } from '@/serializer/types'
import { executeTool } from '@/tools'

const mockExecuteTool = executeTool as Mock

function block(id: string, type: any, params: any = {}, extra: any = {}) {
  return {
    id,
    position: { x: 0, y: 0 },
    metadata: { id: type, name: id, ...extra },
    config: { tool: type, params },
    inputs: {},
    outputs: {},
    enabled: true,
  }
}

const scheduleTrigger = (id: string) => block(id, BlockType.SCHEDULE, {}, { category: 'triggers' })

describe('DAGExecutor — entry point', () => {
  beforeEach(() => {
    ran.length = 0
    mockExecuteTool.mockClear()
  })

  it('manual run starts from the starter even when a schedule trigger is listed first', async () => {
    const wf = {
      version: '2.0',
      blocks: [
        scheduleTrigger('sched'),
        block('start', BlockType.STARTER),
        block('fn1', BlockType.FUNCTION, { code: 'return 11' }),
        block('fn2', BlockType.FUNCTION, { code: 'return 22' }),
      ],
      connections: [
        { source: 'start', target: 'fn1' },
        { source: 'fn1', target: 'fn2' },
      ],
      loops: {},
      parallels: {},
    } as unknown as SerializedWorkflow

    const result = await new DAGExecutor({ workflow: wf, workflowInput: {} }).execute('wf')

    expect(result.success).toBe(true)
    expect(ran).toEqual(['return 11', 'return 22'])
  })

  it('manual run also works with the starter listed first', async () => {
    const wf = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        scheduleTrigger('sched'),
        block('fn1', BlockType.FUNCTION, { code: 'return 11' }),
      ],
      connections: [{ source: 'start', target: 'fn1' }],
      loops: {},
      parallels: {},
    } as unknown as SerializedWorkflow

    const result = await new DAGExecutor({ workflow: wf, workflowInput: {} }).execute('wf')

    expect(result.success).toBe(true)
    expect(ran).toEqual(['return 11'])
  })

  it('a triggered run starts from the given trigger block', async () => {
    const wf = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        scheduleTrigger('sched'),
        block('s1', BlockType.FUNCTION, { code: 'return 99' }),
      ],
      connections: [{ source: 'sched', target: 's1' }],
      loops: {},
      parallels: {},
    } as unknown as SerializedWorkflow

    const result = await new DAGExecutor({ workflow: wf, workflowInput: {} }).execute('wf', 'sched')

    expect(result.success).toBe(true)
    expect(ran).toEqual(['return 99'])
  })
})
