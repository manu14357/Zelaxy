/**
 * Config tests for the Confluence block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ConfluenceBlock } from '@/blocks/blocks/confluence'

describe('Confluence Block Config', () => {
  it('has the correct block type', () => {
    expect(ConfluenceBlock.type).toBe('confluence')
  })

  it("is in the 'tools' category", () => {
    expect(ConfluenceBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ConfluenceBlock.tools.access.length).toBeGreaterThan(0)
    expect(ConfluenceBlock.tools.access).toContain('confluence_retrieve')
    expect(ConfluenceBlock.tools.access).toContain('confluence_update')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ConfluenceBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ConfluenceBlock.name).toBeTruthy()
    expect(ConfluenceBlock.description).toBeTruthy()
  })
})
