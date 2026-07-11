/**
 * Config tests for the Enrich block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { EnrichBlock } from '@/blocks/blocks/enrich'

describe('Enrich Block Config', () => {
  it('has the correct block type', () => {
    expect(EnrichBlock.type).toBe('enrich')
  })

  it("is in the 'tools' category", () => {
    expect(EnrichBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(EnrichBlock.tools.access.length).toBeGreaterThan(0)
    expect(EnrichBlock.tools.access).toContain('enrich_find_email')
    expect(EnrichBlock.tools.access).toContain('enrich_verify_email')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of EnrichBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(EnrichBlock.name).toBeTruthy()
    expect(EnrichBlock.description).toBeTruthy()
  })
})
