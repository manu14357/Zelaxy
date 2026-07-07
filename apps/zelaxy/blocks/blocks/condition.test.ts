/**
 * Config tests for the Condition block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ConditionBlock } from '@/blocks/blocks/condition'

describe('Condition Block Config', () => {
  it('has the correct block type', () => {
    expect(ConditionBlock.type).toBe('condition')
  })

  it("is in the 'blocks' category", () => {
    expect(ConditionBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(ConditionBlock.tools.access).toEqual([])
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = ConditionBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('evaluationMode')
    expect(ids).toContain('conditions')
    expect(ids).toContain('llmModel')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ConditionBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(ConditionBlock.outputs.content).toBeDefined()
    expect(ConditionBlock.outputs.conditionResult).toBeDefined()
    expect(ConditionBlock.outputs.selectedPath).toBeDefined()
    expect(ConditionBlock.outputs.selectedConditionId).toBeDefined()
    expect(ConditionBlock.outputs.llmJudgement).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ConditionBlock.name).toBeTruthy()
    expect(ConditionBlock.description).toBeTruthy()
  })
})
