/**
 * Delegation parity: the Executor facade must produce the same success flag and final output as a
 * directly-constructed DAGExecutor across representative shapes (linear, condition, loop, parallel,
 * switch) — confirming the facade threads its inputs through faithfully. Function execution is
 * mocked for determinism.
 *
 * @vitest-environment node
 */
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/stores/execution/store', () => ({
  useExecutionStore: {
    getState: vi.fn(() => ({
      setIsExecuting: vi.fn(),
      setIsDebugging: vi.fn(),
      setPendingBlocks: vi.fn(),
      reset: vi.fn(),
      setActiveBlocks: vi.fn(),
    })),
    setState: vi.fn(),
  },
}))
vi.mock('@/stores/panel/console/store', () => ({
  useConsoleStore: { getState: vi.fn(() => ({ addConsole: vi.fn() })) },
}))
vi.mock('@/stores/settings/general/store', () => ({
  useGeneralStore: { getState: vi.fn(() => ({ isDebugModeEnabled: false })) },
}))
vi.mock('@/tools', () => ({ executeTool: vi.fn() }))

import { BlockType } from '@/executor/consts'
import { DAGExecutor } from '@/executor/execution/executor'
import { Executor } from '@/executor/index'
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

/** Run through the legacy driver (flag forced off). */
async function runLegacy(wf: SerializedWorkflow): Promise<ExecutionResult> {
  // The facade path (delegates to DAGExecutor).
  return (await new Executor({ workflow: wf, workflowInput: {} }).execute('wf')) as ExecutionResult
}

/** Run through the DAG executor directly. */
function runDag(wf: SerializedWorkflow): Promise<ExecutionResult> {
  return new DAGExecutor({ workflow: wf, workflowInput: {} }).execute('wf')
}

async function expectParity(wf: SerializedWorkflow) {
  const [legacy, dag] = await Promise.all([runLegacy(wf), runDag(wf)])
  expect(dag.success).toBe(legacy.success)
  expect((dag.output as any)?.result).toEqual((legacy.output as any)?.result)
  return { legacy, dag }
}

describe('legacy ↔ DAG output parity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteTool.mockImplementation(async (_tool: string, params: any) => {
      const n = Number(/return\s+(\d+)/.exec(params.code ?? '')?.[1] ?? 0)
      return { success: true, output: { result: n, stdout: '' } }
    })
  })
  afterEach(() => vi.resetAllMocks())

  it('linear chain', async () => {
    await expectParity({
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('a', BlockType.FUNCTION, { code: 'return 42' }),
      ],
      connections: [{ source: 'start', target: 'a' }],
      loops: {},
      parallels: {},
    } as SerializedWorkflow)
  })

  it('condition (true branch)', async () => {
    await expectParity({
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('cond', BlockType.CONDITION, {
          conditions: JSON.stringify([{ id: 'c', expression: 'true' }]),
        }),
        block('t', BlockType.FUNCTION, { code: 'return 11' }),
        block('f', BlockType.FUNCTION, { code: 'return 22' }),
      ],
      connections: [
        { source: 'start', target: 'cond' },
        { source: 'cond', target: 't', sourceHandle: 'true' },
        { source: 'cond', target: 'f', sourceHandle: 'false' },
      ],
      loops: {},
      parallels: {},
    } as SerializedWorkflow)
  })

  it('for loop then post-loop block', async () => {
    const { legacy, dag } = await expectParity({
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
    } as SerializedWorkflow)
    // Both paths run 'after' exactly once and end on its output.
    expect((dag.output as any).result).toBe(9)
    expect((legacy.output as any).result).toBe(9)
  })

  it('parallel then post-parallel block', async () => {
    const { legacy, dag } = await expectParity({
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
    } as unknown as SerializedWorkflow)
    expect((dag.output as any).result).toBe(9)
    expect((legacy.output as any).result).toBe(9)
  })

  it('switch (case b)', async () => {
    await expectParity({
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('sw', BlockType.SWITCH, {
          cases: JSON.stringify([{ id: 'a' }, { id: 'b' }]),
        }),
        block('x', BlockType.FUNCTION, { code: 'return 1' }),
        block('y', BlockType.FUNCTION, { code: 'return 2' }),
      ],
      connections: [
        { source: 'start', target: 'sw' },
        { source: 'sw', target: 'x', sourceHandle: 'case-a' },
        { source: 'sw', target: 'y', sourceHandle: 'case-b' },
      ],
      loops: {},
      parallels: {},
    } as SerializedWorkflow)
  })
})
