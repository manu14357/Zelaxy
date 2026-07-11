/**
 * Config tests for the Dropbox block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DropboxBlock } from '@/blocks/blocks/dropbox'

describe('Dropbox Block Config', () => {
  it('has the correct block type', () => {
    expect(DropboxBlock.type).toBe('dropbox')
  })

  it("is in the 'tools' category", () => {
    expect(DropboxBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DropboxBlock.tools.access.length).toBeGreaterThan(0)
    expect(DropboxBlock.tools.access).toContain('dropbox_upload_file')
    expect(DropboxBlock.tools.access).toContain('dropbox_list_folder')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DropboxBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DropboxBlock.name).toBeTruthy()
    expect(DropboxBlock.description).toBeTruthy()
  })
})
