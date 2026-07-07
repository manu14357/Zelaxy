/**
 * Config tests for the SixtyFour block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { SixtyfourBlock } from '@/blocks/blocks/sixtyfour'

describe('SixtyFour Block Config', () => {
  it('has the correct block type', () => {
    expect(SixtyfourBlock.type).toBe('sixtyfour')
  })

  it("is in the 'tools' category", () => {
    expect(SixtyfourBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(SixtyfourBlock.tools.access.length).toBeGreaterThan(0)
    expect(SixtyfourBlock.tools.access).toContain('sixtyfour_find_phone')
    expect(SixtyfourBlock.tools.access).toContain('sixtyfour_find_email')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of SixtyfourBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(SixtyfourBlock.outputs.result).toBeDefined()
    expect(SixtyfourBlock.outputs.phone).toBeDefined()
    expect(SixtyfourBlock.outputs.email).toBeDefined()
    expect(SixtyfourBlock.outputs.data).toBeDefined()
  })

  it('has a name and description', () => {
    expect(SixtyfourBlock.name).toBeTruthy()
    expect(SixtyfourBlock.description).toBeTruthy()
  })
})
