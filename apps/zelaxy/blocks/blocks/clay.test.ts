/**
 * Config tests for the Clay block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ClayBlock } from '@/blocks/blocks/clay'

describe('Clay Block Config', () => {
  it('has the correct block type', () => {
    expect(ClayBlock.type).toBe('clay')
  })

  it("is in the 'tools' category", () => {
    expect(ClayBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ClayBlock.tools.access.length).toBeGreaterThan(0)
    expect(ClayBlock.tools.access).toContain('clay_populate')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ClayBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ClayBlock.name).toBeTruthy()
    expect(ClayBlock.description).toBeTruthy()
  })
})
