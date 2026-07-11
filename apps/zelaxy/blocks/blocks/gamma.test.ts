/**
 * Config tests for the Gamma block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GammaBlock } from '@/blocks/blocks/gamma'

describe('Gamma Block Config', () => {
  it('has the correct block type', () => {
    expect(GammaBlock.type).toBe('gamma')
  })

  it("is in the 'tools' category", () => {
    expect(GammaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GammaBlock.tools.access.length).toBeGreaterThan(0)
    expect(GammaBlock.tools.access).toContain('gamma_generate')
    expect(GammaBlock.tools.access).toContain('gamma_list_themes')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GammaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GammaBlock.name).toBeTruthy()
    expect(GammaBlock.description).toBeTruthy()
  })
})
