/**
 * Config tests for the Context.dev block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ContextDevBlock } from '@/blocks/blocks/context_dev'

describe('Context.dev Block Config', () => {
  it('has the correct block type', () => {
    expect(ContextDevBlock.type).toBe('context_dev')
  })

  it("is in the 'tools' category", () => {
    expect(ContextDevBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ContextDevBlock.tools.access.length).toBeGreaterThan(0)
    expect(ContextDevBlock.tools.access).toContain('context_dev_search')
    expect(ContextDevBlock.tools.access).toContain('context_dev_crawl')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ContextDevBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ContextDevBlock.name).toBeTruthy()
    expect(ContextDevBlock.description).toBeTruthy()
  })
})
