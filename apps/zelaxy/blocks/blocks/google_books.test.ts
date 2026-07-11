/**
 * Config tests for the Google Books block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GoogleBooksBlock } from '@/blocks/blocks/google_books'

describe('Google Books Block Config', () => {
  it('has the correct block type', () => {
    expect(GoogleBooksBlock.type).toBe('google_books')
  })

  it("is in the 'tools' category", () => {
    expect(GoogleBooksBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GoogleBooksBlock.tools.access.length).toBeGreaterThan(0)
    expect(GoogleBooksBlock.tools.access).toContain('google_books_search_volumes')
    expect(GoogleBooksBlock.tools.access).toContain('google_books_get_volume')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GoogleBooksBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GoogleBooksBlock.name).toBeTruthy()
    expect(GoogleBooksBlock.description).toBeTruthy()
  })
})
