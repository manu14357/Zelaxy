/**
 * Config tests for the ArXiv block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ArxivBlock } from '@/blocks/blocks/arxiv'

describe('ArXiv Block Config', () => {
  it('has the correct block type', () => {
    expect(ArxivBlock.type).toBe('arxiv')
  })

  it("is in the 'tools' category", () => {
    expect(ArxivBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ArxivBlock.tools.access.length).toBeGreaterThan(0)
    expect(ArxivBlock.tools.access).toContain('arxiv_search')
    expect(ArxivBlock.tools.access).toContain('arxiv_get_paper')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ArxivBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ArxivBlock.name).toBeTruthy()
    expect(ArxivBlock.description).toBeTruthy()
  })
})
