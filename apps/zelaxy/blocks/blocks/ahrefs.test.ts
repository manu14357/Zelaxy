/**
 * Config tests for the Ahrefs block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AhrefsBlock } from '@/blocks/blocks/ahrefs'

describe('Ahrefs Block Config', () => {
  it('has the correct block type', () => {
    expect(AhrefsBlock.type).toBe('ahrefs')
  })

  it("is in the 'tools' category", () => {
    expect(AhrefsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AhrefsBlock.tools.access.length).toBeGreaterThan(0)
    expect(AhrefsBlock.tools.access).toContain('ahrefs_domain_rating')
    expect(AhrefsBlock.tools.access).toContain('ahrefs_backlinks')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AhrefsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(AhrefsBlock.outputs.domainRating).toBeDefined()
    expect(AhrefsBlock.outputs.backlinks).toBeDefined()
    expect(AhrefsBlock.outputs.refDomains).toBeDefined()
    expect(AhrefsBlock.outputs.keywords).toBeDefined()
  })

  it('has a name and description', () => {
    expect(AhrefsBlock.name).toBeTruthy()
    expect(AhrefsBlock.description).toBeTruthy()
  })
})
