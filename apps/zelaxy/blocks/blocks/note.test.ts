/**
 * Config tests for the Note block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { NoteBlock } from '@/blocks/blocks/note'

describe('Note Block Config', () => {
  it('has the correct block type', () => {
    expect(NoteBlock.type).toBe('note')
  })

  it("is in the 'blocks' category", () => {
    expect(NoteBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(NoteBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of NoteBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(NoteBlock.inputs.content).toBeDefined()
  })

  it('has no runtime outputs (annotation/trigger block)', () => {
    expect(Object.keys(NoteBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(NoteBlock.name).toBeTruthy()
    expect(NoteBlock.description).toBeTruthy()
  })
})
