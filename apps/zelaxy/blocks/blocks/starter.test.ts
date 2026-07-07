/**
 * Config tests for the Start block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { StarterBlock } from '@/blocks/blocks/starter'

describe('Start Block Config', () => {
  it('has the correct block type', () => {
    expect(StarterBlock.type).toBe('starter')
  })

  it("is in the 'blocks' category", () => {
    expect(StarterBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(StarterBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of StarterBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(StarterBlock.inputs.input).toBeDefined()
  })

  it('has no runtime outputs (annotation/trigger block)', () => {
    expect(Object.keys(StarterBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(StarterBlock.name).toBeTruthy()
    expect(StarterBlock.description).toBeTruthy()
  })
})
