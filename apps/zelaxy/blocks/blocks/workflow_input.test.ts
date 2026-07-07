/**
 * Config tests for the Workflow Input block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { WorkflowInputBlock } from '@/blocks/blocks/workflow_input'

describe('Workflow Input Block Config', () => {
  it('has the correct block type', () => {
    expect(WorkflowInputBlock.type).toBe('workflow_input')
  })

  it("is in the 'blocks' category", () => {
    expect(WorkflowInputBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(WorkflowInputBlock.tools.access).toContain('workflow_executor')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of WorkflowInputBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(WorkflowInputBlock.inputs.workflowId).toBeDefined()
    expect(WorkflowInputBlock.inputs.input).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(WorkflowInputBlock.outputs.success).toBeDefined()
    expect(WorkflowInputBlock.outputs.childWorkflowName).toBeDefined()
    expect(WorkflowInputBlock.outputs.childWorkflowId).toBeDefined()
    expect(WorkflowInputBlock.outputs.result).toBeDefined()
    expect(WorkflowInputBlock.outputs.error).toBeDefined()
    expect(WorkflowInputBlock.outputs.childTraceSpans).toBeDefined()
  })

  it('has a name and description', () => {
    expect(WorkflowInputBlock.name).toBeTruthy()
    expect(WorkflowInputBlock.description).toBeTruthy()
  })
})
