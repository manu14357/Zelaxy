/**
 * Config tests for the Browser Use block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BrowserUseBlock } from '@/blocks/blocks/browser_use'

describe('Browser Use Block Config', () => {
  it('has the correct block type', () => {
    expect(BrowserUseBlock.type).toBe('browser_use')
  })

  it("is in the 'tools' category", () => {
    expect(BrowserUseBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(BrowserUseBlock.tools.access.length).toBeGreaterThan(0)
    expect(BrowserUseBlock.tools.access).toContain('browser_use_run_task')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of BrowserUseBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(BrowserUseBlock.name).toBeTruthy()
    expect(BrowserUseBlock.description).toBeTruthy()
  })
})
