/**
 * Per-iteration / per-branch item resolution on the DAG path: a loop or parallel body that
 * references {{loop.currentItem}} / {{loop.index}} / {{parallel.currentItem}} must see the right
 * value each time. The function tool is mocked to capture the resolved code it receives.
 *
 * @vitest-environment node
 */
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const capturedCodes: string[] = []

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/tools', () => ({
  executeTool: vi.fn(async (_tool: string, params: any) => {
    capturedCodes.push(params.code)
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

const run = (wf: SerializedWorkflow) =>
  new DAGExecutor({ workflow: wf, workflowInput: {}, contextExtensions: {} }).execute('wf')

describe('DAGExecutor — subflow item resolution', () => {
  beforeEach(() => {
    capturedCodes.length = 0
    mockExecuteTool.mockClear()
  })

  it('resolves {{loop.currentItem}} per forEach iteration', async () => {
    await run({
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('loop1', BlockType.LOOP),
        block('body', BlockType.FUNCTION, { code: 'return {{loop.currentItem}}' }),
      ],
      connections: [
        { source: 'start', target: 'loop1' },
        { source: 'loop1', target: 'body', sourceHandle: 'loop-start-source' },
      ],
      loops: {
        loop1: {
          id: 'loop1',
          nodes: ['body'],
          iterations: 5,
          loopType: 'forEach',
          forEachItems: [10, 20, 30],
        },
      },
      parallels: {},
    } as SerializedWorkflow)

    expect(capturedCodes).toEqual(['return 10', 'return 20', 'return 30'])
  })

  it('resolves {{loop.index}} per iteration', async () => {
    await run({
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('loop1', BlockType.LOOP),
        block('body', BlockType.FUNCTION, { code: 'return {{loop.index}}' }),
      ],
      connections: [
        { source: 'start', target: 'loop1' },
        { source: 'loop1', target: 'body', sourceHandle: 'loop-start-source' },
      ],
      loops: { loop1: { id: 'loop1', nodes: ['body'], iterations: 3, loopType: 'for' } },
      parallels: {},
    } as SerializedWorkflow)

    expect(capturedCodes).toEqual(['return 0', 'return 1', 'return 2'])
  })

  it('resolves {{parallel.currentItem}} per branch', async () => {
    await run({
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('par1', BlockType.PARALLEL),
        block('body', BlockType.FUNCTION, { code: 'return {{parallel.currentItem}}' }),
        block('after', BlockType.FUNCTION, { code: 'return 0' }),
      ],
      connections: [
        { source: 'start', target: 'par1' },
        { source: 'par1', target: 'body', sourceHandle: 'parallel-start-source' },
        { source: 'par1', target: 'after', sourceHandle: 'parallel-end-source' },
      ],
      loops: {},
      parallels: { par1: { id: 'par1', nodes: ['body'], distribution: [7, 8, 9] } },
    } as unknown as SerializedWorkflow)

    const branchCodes = capturedCodes.filter((c) => c !== 'return 0').sort()
    expect(branchCodes).toEqual(['return 7', 'return 8', 'return 9'])
  })
})
