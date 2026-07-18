/**
 * Unit tests for the DAG edge manager: given a node's output, it must activate exactly the outgoing
 * edges that output satisfies (condition/router/error/source) and report the newly-ready targets.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BlockType } from '@/executor/consts'
import { DAGBuilder } from '@/executor/dag/builder'
import { EdgeManager } from '@/executor/execution/edge-manager'
import type { NormalizedBlockOutput } from '@/executor/types'
import type { SerializedWorkflow } from '@/serializer/types'

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

function build(wf: SerializedWorkflow) {
  const dag = new DAGBuilder().build(wf, {})
  return { dag, em: new EdgeManager(dag) }
}

describe('EdgeManager — condition routing', () => {
  const wf = {
    version: '2.0',
    blocks: [
      block('start', BlockType.STARTER),
      block('cond', BlockType.CONDITION, {
        conditions: JSON.stringify([{ id: 'c1', expression: 'true' }]),
      }),
      block('a', BlockType.FUNCTION, { code: 'return 1' }),
      block('b', BlockType.FUNCTION, { code: 'return 2' }),
    ],
    connections: [
      { source: 'start', target: 'cond' },
      { source: 'cond', target: 'a', sourceHandle: 'true' },
      { source: 'cond', target: 'b', sourceHandle: 'false' },
    ],
    loops: {},
    parallels: {},
  } as SerializedWorkflow

  it('activates only the true branch when the condition selects true', () => {
    const { dag, em } = build(wf)
    const ready = em.processOutgoingEdges(dag.nodes.get('cond')!, {
      selectedConditionId: 'true',
    } as NormalizedBlockOutput)
    expect(ready).toEqual(['a'])
  })

  it('activates only the false branch when the condition selects false', () => {
    const { dag, em } = build(wf)
    const ready = em.processOutgoingEdges(dag.nodes.get('cond')!, {
      selectedConditionId: 'false',
    } as NormalizedBlockOutput)
    expect(ready).toEqual(['b'])
  })
})

describe('EdgeManager — router routing', () => {
  const wf = {
    version: '2.0',
    blocks: [
      block('start', BlockType.STARTER),
      block('r', BlockType.ROUTER, { prompt: 'x', model: 'gpt-4o' }),
      block('a', BlockType.FUNCTION, { code: 'return 1' }),
      block('b', BlockType.FUNCTION, { code: 'return 2' }),
    ],
    connections: [
      { source: 'start', target: 'r' },
      { source: 'r', target: 'a' },
      { source: 'r', target: 'b' },
    ],
    loops: {},
    parallels: {},
  } as SerializedWorkflow

  it('activates only the selected route target', () => {
    const { dag, em } = build(wf)
    const ready = em.processOutgoingEdges(dag.nodes.get('r')!, {
      selectedPath: { blockId: 'b' },
    } as NormalizedBlockOutput)
    expect(ready).toEqual(['b'])
  })
})

describe('EdgeManager — error routing', () => {
  const wf = {
    version: '2.0',
    blocks: [
      block('start', BlockType.STARTER),
      block('api', BlockType.API, { url: 'http://x', method: 'GET' }),
      block('ok', BlockType.FUNCTION, { code: 'return 1' }),
      block('err', BlockType.FUNCTION, { code: 'return 2' }),
    ],
    connections: [
      { source: 'start', target: 'api' },
      { source: 'api', target: 'ok' },
      { source: 'api', target: 'err', sourceHandle: 'error' },
    ],
    loops: {},
    parallels: {},
  } as SerializedWorkflow

  it('follows the source edge on success, not the error edge', () => {
    const { dag, em } = build(wf)
    const ready = em.processOutgoingEdges(dag.nodes.get('api')!, {
      result: 'ok',
    } as NormalizedBlockOutput)
    expect(ready).toEqual(['ok'])
  })

  it('follows the error edge when the block errors', () => {
    const { dag, em } = build(wf)
    const ready = em.processOutgoingEdges(dag.nodes.get('api')!, {
      error: 'boom',
      status: 500,
    } as NormalizedBlockOutput)
    expect(ready).toEqual(['err'])
  })
})
