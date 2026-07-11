/**
 * Config tests for the Fathom block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { FathomBlock } from '@/blocks/blocks/fathom'

describe('Fathom Block Config', () => {
  it('has the correct block type', () => {
    expect(FathomBlock.type).toBe('fathom')
  })

  it("is in the 'tools' category", () => {
    expect(FathomBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(FathomBlock.tools.access.length).toBeGreaterThan(0)
    expect(FathomBlock.tools.access).toContain('fathom_list_meetings')
    expect(FathomBlock.tools.access).toContain('fathom_get_summary')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of FathomBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(FathomBlock.name).toBeTruthy()
    expect(FathomBlock.description).toBeTruthy()
  })
})
