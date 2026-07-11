/**
 * Config tests for the Document Generator block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DocumentGeneratorBlock } from '@/blocks/blocks/document_generator'

describe('Document Generator Block Config', () => {
  it('has the correct block type', () => {
    expect(DocumentGeneratorBlock.type).toBe('document_generator')
  })

  it("is in the 'tools' category", () => {
    expect(DocumentGeneratorBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DocumentGeneratorBlock.tools.access.length).toBeGreaterThan(0)
    expect(DocumentGeneratorBlock.tools.access).toContain('pdf_generate')
    expect(DocumentGeneratorBlock.tools.access).toContain('docx_generate')
    expect(DocumentGeneratorBlock.tools.access).toContain('pptx_generate')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DocumentGeneratorBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DocumentGeneratorBlock.name).toBeTruthy()
    expect(DocumentGeneratorBlock.description).toBeTruthy()
  })
})
