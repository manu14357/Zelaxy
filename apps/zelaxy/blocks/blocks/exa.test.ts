/**
 * Config tests for the Exa block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ExaBlock } from '@/blocks/blocks/exa'

describe('Exa Block Config', () => {
  it('has the correct block type', () => {
    expect(ExaBlock.type).toBe('exa')
  })

  it("is in the 'tools' category", () => {
    expect(ExaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ExaBlock.tools.access.length).toBeGreaterThan(0)
    expect(ExaBlock.tools.access).toContain('exa_search')
    expect(ExaBlock.tools.access).toContain('exa_answer')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ExaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ExaBlock.name).toBeTruthy()
    expect(ExaBlock.description).toBeTruthy()
  })
})
