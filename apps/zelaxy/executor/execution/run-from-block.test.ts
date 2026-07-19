/**
 * Run-from-block (P2.6): starting a run mid-chain restores upstream OUTPUTS from a snapshot instead
 * of re-executing them, and only the start block plus its downstream closure re-run. A convergent
 * downstream block whose other parent is upstream must not deadlock (its non-dirty incoming edge is
 * pruned). Container-only starts are enforced — a block strictly inside a loop/parallel is rejected.
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
import { DAGBuilder } from '@/executor/dag/builder'
import { DAGExecutor } from '@/executor/execution/executor'
import {
  computeExecutionSets,
  resolveContainerToSentinelStart,
  validateRunFromBlock,
} from '@/executor/utils/run-from-block'
import { buildSentinelStartId } from '@/executor/utils/subflow-utils'
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

describe('DAGExecutor.executeFromBlock', () => {
  beforeEach(() => {
    ran.length = 0
    mockExecuteTool.mockClear()
  })

  it('starts mid-chain: seeded upstream is NOT re-run, downstream runs', async () => {
    const wf = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('fn1', BlockType.FUNCTION, { code: 'return 11' }),
        block('fn2', BlockType.FUNCTION, { code: 'return 22' }),
        block('fn3', BlockType.FUNCTION, { code: 'return 33' }),
      ],
      connections: [
        { source: 'start', target: 'fn1' },
        { source: 'fn1', target: 'fn2' },
        { source: 'fn2', target: 'fn3' },
      ],
      loops: {},
      parallels: {},
    } as unknown as SerializedWorkflow

    const result = await new DAGExecutor({ workflow: wf, workflowInput: {} }).executeFromBlock(
      'wf',
      'fn2',
      {
        blockStates: {
          start: { output: { input: '' } },
          fn1: { output: { result: 11, stdout: '' } },
        },
        executedBlocks: ['start', 'fn1'],
      }
    )

    expect(result.success).toBe(true)
    // Upstream (return 11) never executed; fn2 and fn3 did.
    expect(ran).toEqual(['return 22', 'return 33'])
  })

  it('convergent downstream block does not deadlock (non-dirty incoming edge pruned)', async () => {
    // start → up → conv ;  start → mid → conv ;  conv → out
    // Run from `mid`: dirty = {mid, conv, out}; `up` (and start) are upstream/seeded. conv's incoming
    // edge from the non-dirty `up` must be pruned so conv fires on `mid` alone.
    const wf = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('up', BlockType.FUNCTION, { code: 'return UP' }),
        block('mid', BlockType.FUNCTION, { code: 'return MID' }),
        block('conv', BlockType.FUNCTION, { code: 'return CONV' }),
        block('out', BlockType.FUNCTION, { code: 'return OUT' }),
      ],
      connections: [
        { source: 'start', target: 'up' },
        { source: 'start', target: 'mid' },
        { source: 'up', target: 'conv' },
        { source: 'mid', target: 'conv' },
        { source: 'conv', target: 'out' },
      ],
      loops: {},
      parallels: {},
    } as unknown as SerializedWorkflow

    const result = await new DAGExecutor({ workflow: wf, workflowInput: {} }).executeFromBlock(
      'wf',
      'mid',
      {
        blockStates: {
          start: { output: { input: '' } },
          up: { output: { result: 'UP', stdout: '' } },
        },
        executedBlocks: ['start', 'up'],
      }
    )

    expect(result.success).toBe(true)
    expect(ran).toContain('return MID')
    expect(ran).toContain('return CONV')
    expect(ran).toContain('return OUT')
    expect(ran).not.toContain('return UP')
  })

  it('rejects a block strictly inside a loop with a user-facing error', async () => {
    const wf = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('inner', BlockType.FUNCTION, { code: 'return 1' }),
        block('after', BlockType.FUNCTION, { code: 'return 2' }),
      ],
      connections: [
        { source: 'start', target: 'inner' },
        { source: 'inner', target: 'after' },
      ],
      loops: {
        loop1: { id: 'loop1', nodes: ['inner'], iterations: 2, loopType: 'for' },
      },
      parallels: {},
    } as unknown as SerializedWorkflow

    const result = await new DAGExecutor({ workflow: wf, workflowInput: {} }).executeFromBlock(
      'wf',
      'inner',
      { blockStates: {}, executedBlocks: [] }
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/inside a loop/i)
    expect(ran).toEqual([])
  })
})

describe('run-from-block pure helpers', () => {
  it('resolveContainerToSentinelStart maps a loop container to its sentinel start', () => {
    const dag: any = {
      nodes: new Map(),
      loopConfigs: new Map([['loop1', { id: 'loop1', nodes: ['a'] }]]),
      parallelConfigs: new Map(),
    }
    expect(resolveContainerToSentinelStart('loop1', dag)).toBe(buildSentinelStartId('loop1'))
    expect(resolveContainerToSentinelStart('plain', dag)).toBe('plain')
  })

  it('validateRunFromBlock accepts a plain block, a container, and rejects loop-internal blocks', () => {
    const wf = {
      version: '2.0',
      blocks: [
        block('start', BlockType.STARTER),
        block('inner', BlockType.FUNCTION, { code: 'return 1' }),
        block('tail', BlockType.FUNCTION, { code: 'return 2' }),
      ],
      connections: [
        { source: 'start', target: 'inner' },
        { source: 'inner', target: 'tail' },
      ],
      loops: { loop1: { id: 'loop1', nodes: ['inner'], iterations: 2, loopType: 'for' } },
      parallels: {},
    } as unknown as SerializedWorkflow

    const dag = new DAGBuilder().build(wf, { includeAllBlocks: true })

    expect(validateRunFromBlock('tail', dag)).toEqual({
      valid: true,
      effectiveStartBlockId: 'tail',
    })
    expect(validateRunFromBlock('loop1', dag)).toEqual({
      valid: true,
      effectiveStartBlockId: buildSentinelStartId('loop1'),
    })
    const rejected = validateRunFromBlock('inner', dag)
    expect(rejected.valid).toBe(false)
    expect(rejected.error).toMatch(/inside a loop/i)
  })

  it('computeExecutionSets splits dirty (downstream) from upstream (feeders)', () => {
    const wf = {
      version: '2.0',
      blocks: [
        block('a', BlockType.FUNCTION, { code: 'return a' }),
        block('b', BlockType.FUNCTION, { code: 'return b' }),
        block('c', BlockType.FUNCTION, { code: 'return c' }),
      ],
      connections: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ],
      loops: {},
      parallels: {},
    } as unknown as SerializedWorkflow

    const dag = new DAGBuilder().build(wf, { includeAllBlocks: true })
    const { dirtySet, upstreamSet } = computeExecutionSets(dag, 'b')

    expect(dirtySet.has('b')).toBe(true)
    expect(dirtySet.has('c')).toBe(true)
    expect(dirtySet.has('a')).toBe(false)
    expect(upstreamSet.has('a')).toBe(true)
    expect(upstreamSet.has('b')).toBe(false)
  })
})
