/**
 * Config tests for the Amazon Textract block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { TextractBlock } from '@/blocks/blocks/textract'

describe('Amazon Textract Block Config', () => {
  it('has the correct block type', () => {
    expect(TextractBlock.type).toBe('textract')
  })

  it("is in the 'tools' category", () => {
    expect(TextractBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(TextractBlock.tools.access.length).toBeGreaterThan(0)
    expect(TextractBlock.tools.access).toContain('textract_analyze_document')
    expect(TextractBlock.tools.access).toContain('textract_detect_document_text')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of TextractBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(TextractBlock.name).toBeTruthy()
    expect(TextractBlock.description).toBeTruthy()
  })
})
