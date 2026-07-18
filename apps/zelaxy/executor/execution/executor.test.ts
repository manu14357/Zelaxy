/**
 * Smoke tests for the sentinel/orchestrator DAG executor. These exercise the driver end-to-end
 * (builder → engine → edge-manager → orchestrators → handlers) on real workflows, independent of
 * the legacy path. Function execution is mocked so the tests isolate the driver, not the sandbox.
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

/** Mock the function sandbox: evaluate the block's `return <number>` and echo it as the result. */
function mockFunctionByReturnedNumber() {
  mockExecuteTool.mockImplementation(async (_tool: string, params: any) => {
    const match = /return\s+([0-9+\-*/ .]+)/.exec(params.code ?? '')
    // biome-ignore lint/security/noGlobalEval: test-only arithmetic evaluation of a controlled string
    const value = match ? eval(match[1]) : undefined
    return { success: true, output: { result: value, stdout: '' } }
  })
}

function fnBlock(id: string, code: string, name = id) {
  return {
    id,
    position: { x: 0, y: 0 },
    metadata: { id: BlockType.FUNCTION, name },
    config: { tool: BlockType.FUNCTION, params: { code } },
    inputs: {},
    outputs: {},
    enabled: true,
  }
}

function starter() {
  return {
    id: 'start',
    position: { x: 0, y: 0 },
    metadata: { id: BlockType.STARTER, name: 'Start' },
    config: { tool: BlockType.STARTER, params: {} },
    inputs: {},
    outputs: {},
    enabled: true,
  }
}

const run = (wf: SerializedWorkflow, input?: any): Promise<ExecutionResult> =>
  new DAGExecutor({
    workflow: wf,
    workflowInput: input,
    contextExtensions: { executionId: `e-${Math.random()}` },
  }).execute('wf')

describe('DAGExecutor — linear execution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFunctionByReturnedNumber()
  })

  it('runs a starter → function workflow and returns the function output', async () => {
    const wf: SerializedWorkflow = {
      version: '2.0',
      blocks: [starter(), fnBlock('fn', 'return 21 + 21')],
      connections: [{ source: 'start', target: 'fn' }],
      loops: {},
      parallels: {},
    } as SerializedWorkflow

    const result = await run(wf)

    expect(result.success).toBe(true)
    expect(result.output.result).toBe(42)
    expect(result.logs?.some((l) => l.blockId === 'fn' && l.success)).toBe(true)
  })

  it('runs a chain of two function blocks in order', async () => {
    const wf: SerializedWorkflow = {
      version: '2.0',
      blocks: [starter(), fnBlock('a', 'return 2'), fnBlock('b', 'return 100')],
      connections: [
        { source: 'start', target: 'a' },
        { source: 'a', target: 'b' },
      ],
      loops: {},
      parallels: {},
    } as SerializedWorkflow

    const result = await run(wf)

    expect(result.success).toBe(true)
    expect(result.output.result).toBe(100)
    expect(
      result.logs?.filter((l) => l.success && (l.blockId === 'a' || l.blockId === 'b')).length
    ).toBe(2)
  })
})
