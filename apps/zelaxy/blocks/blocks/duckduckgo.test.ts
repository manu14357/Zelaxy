/**
 * Config tests for the DuckDuckGo block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DuckDuckGoBlock } from '@/blocks/blocks/duckduckgo'

describe('DuckDuckGo Block Config', () => {
  it('has the correct block type', () => {
    expect(DuckDuckGoBlock.type).toBe('duckduckgo')
  })

  it("is in the 'tools' category", () => {
    expect(DuckDuckGoBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DuckDuckGoBlock.tools.access.length).toBeGreaterThan(0)
    expect(DuckDuckGoBlock.tools.access).toContain('duckduckgo_text_search')
    expect(DuckDuckGoBlock.tools.access).toContain('duckduckgo_news_search')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DuckDuckGoBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DuckDuckGoBlock.name).toBeTruthy()
    expect(DuckDuckGoBlock.description).toBeTruthy()
  })
})
