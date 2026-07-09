/**
 * Config tests for the Box block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BoxBlock } from '@/blocks/blocks/box'

describe('Box Block Config', () => {
  it('has the correct block type', () => {
    expect(BoxBlock.type).toBe('box')
  })

  it("is in the 'tools' category", () => {
    expect(BoxBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(BoxBlock.tools.access.length).toBeGreaterThan(0)
    expect(BoxBlock.tools.access).toContain('box_upload_file')
    expect(BoxBlock.tools.access).toContain('box_list_folder')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of BoxBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(BoxBlock.name).toBeTruthy()
    expect(BoxBlock.description).toBeTruthy()
  })
})
