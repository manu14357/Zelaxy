/**
 * Config tests for the Ashby block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AshbyBlock } from '@/blocks/blocks/ashby'

describe('Ashby Block Config', () => {
  it('has the correct block type', () => {
    expect(AshbyBlock.type).toBe('ashby')
  })

  it("is in the 'tools' category", () => {
    expect(AshbyBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AshbyBlock.tools.access.length).toBeGreaterThan(0)
    expect(AshbyBlock.tools.access).toContain('ashby_list_candidates')
    expect(AshbyBlock.tools.access).toContain('ashby_get_candidate')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AshbyBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AshbyBlock.name).toBeTruthy()
    expect(AshbyBlock.description).toBeTruthy()
  })
})
