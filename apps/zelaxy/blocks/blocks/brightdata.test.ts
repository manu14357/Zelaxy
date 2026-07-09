/**
 * Config tests for the Bright Data block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BrightDataBlock } from '@/blocks/blocks/brightdata'

describe('Bright Data Block Config', () => {
  it('has the correct block type', () => {
    expect(BrightDataBlock.type).toBe('brightdata')
  })

  it("is in the 'tools' category", () => {
    expect(BrightDataBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(BrightDataBlock.tools.access.length).toBeGreaterThan(0)
    expect(BrightDataBlock.tools.access).toContain('brightdata_scrape_url')
    expect(BrightDataBlock.tools.access).toContain('brightdata_serp_search')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of BrightDataBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(BrightDataBlock.name).toBeTruthy()
    expect(BrightDataBlock.description).toBeTruthy()
  })
})
