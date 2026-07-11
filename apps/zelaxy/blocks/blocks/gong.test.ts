/**
 * Config tests for the Gong block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GongBlock } from '@/blocks/blocks/gong'

describe('Gong Block Config', () => {
  it('has the correct block type', () => {
    expect(GongBlock.type).toBe('gong')
  })

  it("is in the 'tools' category", () => {
    expect(GongBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GongBlock.tools.access.length).toBeGreaterThan(0)
    expect(GongBlock.tools.access).toContain('gong_list_calls')
    expect(GongBlock.tools.access).toContain('gong_get_call')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GongBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GongBlock.name).toBeTruthy()
    expect(GongBlock.description).toBeTruthy()
  })
})
