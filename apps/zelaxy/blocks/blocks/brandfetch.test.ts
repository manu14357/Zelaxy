/**
 * Config tests for the Brandfetch block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BrandfetchBlock } from '@/blocks/blocks/brandfetch'

describe('Brandfetch Block Config', () => {
  it('has the correct block type', () => {
    expect(BrandfetchBlock.type).toBe('brandfetch')
  })

  it("is in the 'tools' category", () => {
    expect(BrandfetchBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(BrandfetchBlock.tools.access.length).toBeGreaterThan(0)
    expect(BrandfetchBlock.tools.access).toContain('brandfetch_get_brand')
    expect(BrandfetchBlock.tools.access).toContain('brandfetch_search')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of BrandfetchBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(BrandfetchBlock.name).toBeTruthy()
    expect(BrandfetchBlock.description).toBeTruthy()
  })
})
