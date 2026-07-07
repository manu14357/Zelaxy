/**
 * Config tests for the Workflow block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { WorkflowBlock } from '@/blocks/blocks/workflow'

describe('Workflow Block Config', () => {
  it('has the correct block type', () => {
    expect(WorkflowBlock.type).toBe('workflow')
  })

  it("is in the 'blocks' category", () => {
    expect(WorkflowBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(WorkflowBlock.tools.access).toContain('workflow_executor')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of WorkflowBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(WorkflowBlock.inputs.workflowId).toBeDefined()
    expect(WorkflowBlock.inputs.input).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(WorkflowBlock.outputs.success).toBeDefined()
    expect(WorkflowBlock.outputs.childWorkflowName).toBeDefined()
    expect(WorkflowBlock.outputs.result).toBeDefined()
    expect(WorkflowBlock.outputs.error).toBeDefined()
  })

  it('has a name and description', () => {
    expect(WorkflowBlock.name).toBeTruthy()
    expect(WorkflowBlock.description).toBeTruthy()
  })
})
