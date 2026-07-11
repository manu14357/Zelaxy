/**
 * Config tests for the Dropcontact block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DropcontactBlock } from '@/blocks/blocks/dropcontact'

describe('Dropcontact Block Config', () => {
  it('has the correct block type', () => {
    expect(DropcontactBlock.type).toBe('dropcontact')
  })

  it("is in the 'tools' category", () => {
    expect(DropcontactBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DropcontactBlock.tools.access.length).toBeGreaterThan(0)
    expect(DropcontactBlock.tools.access).toContain('dropcontact_enrich')
    expect(DropcontactBlock.tools.access).toContain('dropcontact_get_batch')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DropcontactBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DropcontactBlock.name).toBeTruthy()
    expect(DropcontactBlock.description).toBeTruthy()
  })
})
