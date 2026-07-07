/**
 * Config tests for the A2A block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { A2ABlock } from '@/blocks/blocks/a2a'

describe('A2A Block Config', () => {
  it('has the correct block type', () => {
    expect(A2ABlock.type).toBe('a2a')
  })

  it("is in the 'tools' category", () => {
    expect(A2ABlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(A2ABlock.tools.access.length).toBeGreaterThan(0)
    expect(A2ABlock.tools.access).toContain('a2a_send_message')
    expect(A2ABlock.tools.access).toContain('a2a_get_task')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of A2ABlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(A2ABlock.outputs.content).toBeDefined()
    expect(A2ABlock.outputs.taskId).toBeDefined()
    expect(A2ABlock.outputs.contextId).toBeDefined()
    expect(A2ABlock.outputs.state).toBeDefined()
    expect(A2ABlock.outputs.artifacts).toBeDefined()
  })

  it('has a name and description', () => {
    expect(A2ABlock.name).toBeTruthy()
    expect(A2ABlock.description).toBeTruthy()
  })
})
