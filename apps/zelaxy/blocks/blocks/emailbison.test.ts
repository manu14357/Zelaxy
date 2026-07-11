/**
 * Config tests for the Email Bison block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { EmailBisonBlock } from '@/blocks/blocks/emailbison'

describe('Email Bison Block Config', () => {
  it('has the correct block type', () => {
    expect(EmailBisonBlock.type).toBe('emailbison')
  })

  it("is in the 'tools' category", () => {
    expect(EmailBisonBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(EmailBisonBlock.tools.access.length).toBeGreaterThan(0)
    expect(EmailBisonBlock.tools.access).toContain('emailbison_find_email')
    expect(EmailBisonBlock.tools.access).toContain('emailbison_verify_email')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of EmailBisonBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(EmailBisonBlock.name).toBeTruthy()
    expect(EmailBisonBlock.description).toBeTruthy()
  })
})
