/**
 * Config tests for the Fireflies block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { FirefliesBlock } from '@/blocks/blocks/fireflies'

describe('Fireflies Block Config', () => {
  it('has the correct block type', () => {
    expect(FirefliesBlock.type).toBe('fireflies')
  })

  it("is in the 'tools' category", () => {
    expect(FirefliesBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(FirefliesBlock.tools.access.length).toBeGreaterThan(0)
    expect(FirefliesBlock.tools.access).toContain('fireflies_list_transcripts')
    expect(FirefliesBlock.tools.access).toContain('fireflies_get_transcript')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of FirefliesBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(FirefliesBlock.name).toBeTruthy()
    expect(FirefliesBlock.description).toBeTruthy()
  })
})
