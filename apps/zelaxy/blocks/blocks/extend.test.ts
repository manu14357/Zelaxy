/**
 * Config tests for the Extend block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ExtendBlock } from '@/blocks/blocks/extend'

describe('Extend Block Config', () => {
  it('has the correct block type', () => {
    expect(ExtendBlock.type).toBe('extend')
  })

  it("is in the 'tools' category", () => {
    expect(ExtendBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ExtendBlock.tools.access.length).toBeGreaterThan(0)
    expect(ExtendBlock.tools.access).toContain('extend_parse')
    expect(ExtendBlock.tools.access).toContain('extend_get_run')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ExtendBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ExtendBlock.name).toBeTruthy()
    expect(ExtendBlock.description).toBeTruthy()
  })
})
