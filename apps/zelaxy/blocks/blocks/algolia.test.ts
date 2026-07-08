/**
 * Config tests for the Algolia block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AlgoliaBlock } from '@/blocks/blocks/algolia'

describe('Algolia Block Config', () => {
  it('has the correct block type', () => {
    expect(AlgoliaBlock.type).toBe('algolia')
  })

  it("is in the 'tools' category", () => {
    expect(AlgoliaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AlgoliaBlock.tools.access.length).toBeGreaterThan(0)
    expect(AlgoliaBlock.tools.access).toContain('algolia_search')
    expect(AlgoliaBlock.tools.access).toContain('algolia_index_document')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AlgoliaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AlgoliaBlock.name).toBeTruthy()
    expect(AlgoliaBlock.description).toBeTruthy()
  })
})
