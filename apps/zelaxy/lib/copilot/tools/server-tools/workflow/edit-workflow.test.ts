import { describe, expect, it, vi } from 'vitest'

// The global vitest.setup.ts mocks @/blocks/registry with a stub `getAllBlocks` returning `{}`
// (fine for executor-handler tests, which don't touch it) — editWorkflowLocal genuinely needs the
// real registry to resolve sub-block configs (e.g. a condition block's `conditions` field), so
// un-mock it for this file.
vi.mock('@/blocks/registry', async (importOriginal) => importOriginal())

import { editWorkflowTool } from './edit-workflow'

function baseWorkflowState() {
  return {
    blocks: {
      'starter-1': {
        id: 'starter-1',
        type: 'starter',
        name: 'Start 1',
        position: { x: -120, y: 0 },
        subBlocks: { startWorkflow: { id: 'startWorkflow', type: 'dropdown', value: 'manual' } },
        enabled: true,
        outputs: {},
        horizontalHandles: true,
        isWide: false,
        height: 90,
        data: {},
      },
    },
    edges: [],
    loops: {},
    parallels: {},
  }
}

describe('edit_workflow — add operation field-location leniency', () => {
  it('creates a block whose "type" was sent as a sibling of params, not nested inside it, and defaults its name from block_id', async () => {
    const result = await editWorkflowTool.execute({
      workflowId: 'test-workflow',
      currentUserWorkflow: JSON.stringify(baseWorkflowState()),
      operations: [
        {
          operation_type: 'add',
          block_id: 'function_route_a',
          // Observed real-world shape: `type` as a sibling of `params`, no `name` anywhere.
          type: 'function',
          params: {
            inputs: { code: "return { branch: 'A' };", language: 'javascript' },
          },
        } as any,
      ],
    })

    expect(result.success).toBe(true)
    const workflowState = (result.data as any).workflowState
    expect(workflowState.blocks.function_route_a).toBeDefined()
    expect(workflowState.blocks.function_route_a.type).toBe('function')
    expect(workflowState.blocks.function_route_a.name).toBe('Function Route A')
    expect((result.data as any).inputValidationErrors ?? []).toHaveLength(0)
  })

  it('reproduces the full reported scenario: a condition block plus four branch targets, all with sibling-level type, wired via connections.conditions', async () => {
    const result = await editWorkflowTool.execute({
      workflowId: 'test-workflow',
      currentUserWorkflow: JSON.stringify(baseWorkflowState()),
      operations: [
        {
          operation_type: 'add',
          block_id: 'condition_1',
          type: 'condition',
          params: {
            inputs: {
              evaluationMode: 'expression',
              conditions: {
                if: "{{starter_1.output}} == 'route_a'",
                'else-if': "{{starter_1.output}} == 'route_b'",
                'else-if-2': "{{starter_1.output}} == 'route_c'",
              },
            },
            connections: {
              conditions: {
                if: 'function_route_a',
                'else-if': 'function_route_b',
                'else-if-2': 'function_route_c',
                else: 'function_route_default',
              },
            },
            position: { x: 200, y: 0 },
          },
        } as any,
        {
          operation_type: 'add',
          block_id: 'function_route_a',
          type: 'function',
          params: { inputs: { code: "return { branch: 'A' };", language: 'javascript' } },
        } as any,
        {
          operation_type: 'add',
          block_id: 'function_route_b',
          type: 'function',
          params: { inputs: { code: "return { branch: 'B' };", language: 'javascript' } },
        } as any,
        {
          operation_type: 'add',
          block_id: 'function_route_c',
          type: 'function',
          params: { inputs: { code: "return { branch: 'C' };", language: 'javascript' } },
        } as any,
        {
          operation_type: 'add',
          block_id: 'function_route_default',
          type: 'function',
          params: { inputs: { code: "return { branch: 'default' };", language: 'javascript' } },
        } as any,
        {
          operation_type: 'edit',
          block_id: 'starter-1',
          params: { connections: { outgoing: [{ target: 'condition_1' }] } },
        },
      ],
    })

    expect(result.success).toBe(true)
    const workflowState = (result.data as any).workflowState

    // All five blocks were actually created — this is the exact case that previously logged
    // "Invalid add operation ... missing type or name" and silently dropped every one of them.
    for (const id of [
      'condition_1',
      'function_route_a',
      'function_route_b',
      'function_route_c',
      'function_route_default',
    ]) {
      expect(workflowState.blocks[id]).toBeDefined()
    }
    expect(workflowState.blocks.condition_1.type).toBe('condition')

    // The condition block's branches resolved to the correct handles (matching createConditionHandle:
    // if -> 'true', else -> 'false', any else-if -> 'condition-<blockId>-<key>').
    const conditionEdges = workflowState.edges.filter((e: any) => e.source === 'condition_1')
    expect(conditionEdges).toHaveLength(4)
    expect(conditionEdges.find((e: any) => e.target === 'function_route_a')?.sourceHandle).toBe(
      'true'
    )
    expect(
      conditionEdges.find((e: any) => e.target === 'function_route_default')?.sourceHandle
    ).toBe('false')
    expect(
      conditionEdges.find((e: any) => e.target === 'function_route_b')?.sourceHandle
    ).toContain('condition-')
    expect(
      conditionEdges.find((e: any) => e.target === 'function_route_c')?.sourceHandle
    ).toContain('condition-')

    // Every edge in the final state points at a block that actually exists — the exact invariant
    // whose violation caused the reported Postgres foreign-key error on save.
    const blockIds = new Set(Object.keys(workflowState.blocks))
    for (const edge of workflowState.edges) {
      expect(blockIds.has(edge.source)).toBe(true)
      expect(blockIds.has(edge.target)).toBe(true)
    }
  })

  it('rejects an add operation with no type anywhere, reports it, and strips the resulting dangling edge instead of persisting it', async () => {
    const result = await editWorkflowTool.execute({
      workflowId: 'test-workflow',
      currentUserWorkflow: JSON.stringify(baseWorkflowState()),
      operations: [
        {
          operation_type: 'add',
          block_id: 'mystery_block',
          params: { inputs: {} },
          // no `type` in params or on the operation itself
        } as any,
        {
          operation_type: 'edit',
          block_id: 'starter-1',
          params: { connections: { outgoing: [{ target: 'mystery_block' }] } },
        },
      ],
    })

    expect(result.success).toBe(true)
    const data = result.data as any

    expect(data.workflowState.blocks.mystery_block).toBeUndefined()
    expect(data.inputValidationErrors).toBeDefined()
    expect(data.inputValidationErrors.some((e: any) => e.block === 'mystery_block')).toBe(true)

    // The edge the 'edit' operation wired to the never-created block must not survive into the
    // returned/persisted state.
    const blockIds = new Set(Object.keys(data.workflowState.blocks))
    for (const edge of data.workflowState.edges) {
      expect(blockIds.has(edge.source)).toBe(true)
      expect(blockIds.has(edge.target)).toBe(true)
    }
  })
})
