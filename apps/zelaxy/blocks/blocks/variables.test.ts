/**
 * Config tests for the Variables block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { VariablesBlock } from '@/blocks/blocks/variables'

describe('Variables Block Config', () => {
  it('has the correct block type', () => {
    expect(VariablesBlock.type).toBe('variables')
  })

  it("is in the 'blocks' category", () => {
    expect(VariablesBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(VariablesBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of VariablesBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(VariablesBlock.inputs.assignments).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(VariablesBlock.outputs.variables).toBeDefined()
    expect(VariablesBlock.outputs.count).toBeDefined()
  })

  it('has a name and description', () => {
    expect(VariablesBlock.name).toBeTruthy()
    expect(VariablesBlock.description).toBeTruthy()
  })
})
