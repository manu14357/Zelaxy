/**
 * Config tests for the Human in the Loop block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { HumanInTheLoopBlock } from '@/blocks/blocks/human_in_the_loop'

describe('Human in the Loop Block Config', () => {
  it('has the correct block type', () => {
    expect(HumanInTheLoopBlock.type).toBe('human_in_the_loop')
  })

  it("is in the 'blocks' category", () => {
    expect(HumanInTheLoopBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(HumanInTheLoopBlock.tools.access).toEqual([])
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = HumanInTheLoopBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('title')
    expect(ids).toContain('message')
    expect(ids).toContain('approvalType')
    expect(ids).toContain('timeout')
    expect(ids).toContain('approvers')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of HumanInTheLoopBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(HumanInTheLoopBlock.outputs.status).toBeDefined()
    expect(HumanInTheLoopBlock.outputs.response).toBeDefined()
    expect(HumanInTheLoopBlock.outputs.approvedBy).toBeDefined()
    expect(HumanInTheLoopBlock.outputs.contextId).toBeDefined()
    expect(HumanInTheLoopBlock.outputs.resumedAt).toBeDefined()
  })

  it('has a name and description', () => {
    expect(HumanInTheLoopBlock.name).toBeTruthy()
    expect(HumanInTheLoopBlock.description).toBeTruthy()
  })
})
