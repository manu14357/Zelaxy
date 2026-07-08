/**
 * Config tests for the Apollo block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ApolloBlock } from '@/blocks/blocks/apollo'

describe('Apollo Block Config', () => {
  it('has the correct block type', () => {
    expect(ApolloBlock.type).toBe('apollo')
  })

  it("is in the 'tools' category", () => {
    expect(ApolloBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ApolloBlock.tools.access.length).toBeGreaterThan(0)
    expect(ApolloBlock.tools.access).toContain('apollo_people_search')
    expect(ApolloBlock.tools.access).toContain('apollo_people_enrich')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ApolloBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ApolloBlock.name).toBeTruthy()
    expect(ApolloBlock.description).toBeTruthy()
  })
})
