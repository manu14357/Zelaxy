/**
 * Config tests for the Amazon SES block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { SesBlock } from '@/blocks/blocks/ses'

describe('Amazon SES Block Config', () => {
  it('has the correct block type', () => {
    expect(SesBlock.type).toBe('ses')
  })

  it("is in the 'tools' category", () => {
    expect(SesBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(SesBlock.tools.access.length).toBeGreaterThan(0)
    expect(SesBlock.tools.access).toContain('ses_send_email')
    expect(SesBlock.tools.access).toContain('ses_list_identities')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of SesBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(SesBlock.name).toBeTruthy()
    expect(SesBlock.description).toBeTruthy()
  })
})
