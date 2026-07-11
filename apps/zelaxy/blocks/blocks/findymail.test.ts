/**
 * Config tests for the Findymail block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { FindymailBlock } from '@/blocks/blocks/findymail'

describe('Findymail Block Config', () => {
  it('has the correct block type', () => {
    expect(FindymailBlock.type).toBe('findymail')
  })

  it("is in the 'tools' category", () => {
    expect(FindymailBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(FindymailBlock.tools.access.length).toBeGreaterThan(0)
    expect(FindymailBlock.tools.access).toContain('findymail_find_email')
    expect(FindymailBlock.tools.access).toContain('findymail_verify_email')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of FindymailBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(FindymailBlock.name).toBeTruthy()
    expect(FindymailBlock.description).toBeTruthy()
  })
})
