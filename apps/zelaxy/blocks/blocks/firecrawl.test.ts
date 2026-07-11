/**
 * Config tests for the Firecrawl block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { FirecrawlBlock } from '@/blocks/blocks/firecrawl'

describe('Firecrawl Block Config', () => {
  it('has the correct block type', () => {
    expect(FirecrawlBlock.type).toBe('firecrawl')
  })

  it("is in the 'tools' category", () => {
    expect(FirecrawlBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(FirecrawlBlock.tools.access.length).toBeGreaterThan(0)
    expect(FirecrawlBlock.tools.access).toContain('firecrawl_scrape')
    expect(FirecrawlBlock.tools.access).toContain('firecrawl_search')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of FirecrawlBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(FirecrawlBlock.name).toBeTruthy()
    expect(FirecrawlBlock.description).toBeTruthy()
  })
})
