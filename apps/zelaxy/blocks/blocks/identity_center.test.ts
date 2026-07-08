/**
 * Config tests for the Identity Center block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { IdentityCenterBlock } from '@/blocks/blocks/identity_center'

describe('Identity Center Block Config', () => {
  it('has the correct block type', () => {
    expect(IdentityCenterBlock.type).toBe('identity_center')
  })

  it("is in the 'tools' category", () => {
    expect(IdentityCenterBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(IdentityCenterBlock.tools.access.length).toBeGreaterThan(0)
    expect(IdentityCenterBlock.tools.access).toContain('identity_center_list_users')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of IdentityCenterBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(IdentityCenterBlock.name).toBeTruthy()
    expect(IdentityCenterBlock.description).toBeTruthy()
  })
})
