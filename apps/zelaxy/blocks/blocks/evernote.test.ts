/**
 * Config tests for the Evernote block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { EvernoteBlock } from '@/blocks/blocks/evernote'

describe('Evernote Block Config', () => {
  it('has the correct block type', () => {
    expect(EvernoteBlock.type).toBe('evernote')
  })

  it("is in the 'tools' category", () => {
    expect(EvernoteBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(EvernoteBlock.tools.access.length).toBeGreaterThan(0)
    expect(EvernoteBlock.tools.access).toContain('evernote_create_note')
    expect(EvernoteBlock.tools.access).toContain('evernote_search_notes')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of EvernoteBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(EvernoteBlock.name).toBeTruthy()
    expect(EvernoteBlock.description).toBeTruthy()
  })
})
