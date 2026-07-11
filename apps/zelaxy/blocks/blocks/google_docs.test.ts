/**
 * Config tests for the Google Docs block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GoogleDocsBlock } from '@/blocks/blocks/google_docs'

describe('Google Docs Block Config', () => {
  it('has the correct block type', () => {
    expect(GoogleDocsBlock.type).toBe('google_docs')
  })

  it("is in the 'tools' category", () => {
    expect(GoogleDocsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GoogleDocsBlock.tools.access.length).toBeGreaterThan(0)
    expect(GoogleDocsBlock.tools.access).toContain('google_docs_read')
    expect(GoogleDocsBlock.tools.access).toContain('google_docs_write')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GoogleDocsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GoogleDocsBlock.name).toBeTruthy()
    expect(GoogleDocsBlock.description).toBeTruthy()
  })
})
