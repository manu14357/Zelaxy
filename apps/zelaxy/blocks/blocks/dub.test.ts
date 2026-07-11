/**
 * Config tests for the Dub block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DubBlock } from '@/blocks/blocks/dub'

describe('Dub Block Config', () => {
  it('has the correct block type', () => {
    expect(DubBlock.type).toBe('dub')
  })

  it("is in the 'tools' category", () => {
    expect(DubBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DubBlock.tools.access.length).toBeGreaterThan(0)
    expect(DubBlock.tools.access).toContain('dub_create_link')
    expect(DubBlock.tools.access).toContain('dub_list_links')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DubBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DubBlock.name).toBeTruthy()
    expect(DubBlock.description).toBeTruthy()
  })
})
