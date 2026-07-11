/**
 * Config tests for the File block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { FileBlock } from '@/blocks/blocks/file'

describe('File Block Config', () => {
  it('has the correct block type', () => {
    expect(FileBlock.type).toBe('file')
  })

  it("is in the 'tools' category", () => {
    expect(FileBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(FileBlock.tools.access.length).toBeGreaterThan(0)
    expect(FileBlock.tools.access).toContain('file_parser')
    expect(FileBlock.tools.access).toContain('file_write')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of FileBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(FileBlock.name).toBeTruthy()
    expect(FileBlock.description).toBeTruthy()
  })
})
