/**
 * Config tests for the Gmail block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GmailBlock } from '@/blocks/blocks/gmail'

describe('Gmail Block Config', () => {
  it('has the correct block type', () => {
    expect(GmailBlock.type).toBe('gmail')
  })

  it("is in the 'tools' category", () => {
    expect(GmailBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GmailBlock.tools.access.length).toBeGreaterThan(0)
    expect(GmailBlock.tools.access).toContain('gmail_send')
    expect(GmailBlock.tools.access).toContain('gmail_read')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GmailBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GmailBlock.name).toBeTruthy()
    expect(GmailBlock.description).toBeTruthy()
  })
})
