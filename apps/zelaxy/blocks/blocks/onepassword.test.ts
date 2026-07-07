/**
 * Config tests for the 1Password block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { OnePasswordBlock } from '@/blocks/blocks/onepassword'

describe('1Password Block Config', () => {
  it('has the correct block type', () => {
    expect(OnePasswordBlock.type).toBe('onepassword')
  })

  it("is in the 'tools' category", () => {
    expect(OnePasswordBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(OnePasswordBlock.tools.access.length).toBeGreaterThan(0)
    expect(OnePasswordBlock.tools.access).toContain('onepassword_list_vaults')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of OnePasswordBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(OnePasswordBlock.outputs.data).toBeDefined()
    expect(OnePasswordBlock.outputs.metadata).toBeDefined()
  })

  it('has a name and description', () => {
    expect(OnePasswordBlock.name).toBeTruthy()
    expect(OnePasswordBlock.description).toBeTruthy()
  })
})
