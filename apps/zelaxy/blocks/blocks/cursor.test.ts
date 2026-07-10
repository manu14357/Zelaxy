/**
 * Config tests for the Cursor block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CursorBlock } from '@/blocks/blocks/cursor'

describe('Cursor Block Config', () => {
  it('has the correct block type', () => {
    expect(CursorBlock.type).toBe('cursor')
  })

  it("is in the 'tools' category", () => {
    expect(CursorBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CursorBlock.tools.access.length).toBeGreaterThan(0)
    expect(CursorBlock.tools.access).toContain('cursor_launch_agent')
    expect(CursorBlock.tools.access).toContain('cursor_list_agents')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CursorBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CursorBlock.name).toBeTruthy()
    expect(CursorBlock.description).toBeTruthy()
  })
})
