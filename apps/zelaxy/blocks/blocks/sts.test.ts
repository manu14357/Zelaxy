/**
 * Config tests for the AWS STS block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { StsBlock } from '@/blocks/blocks/sts'

describe('AWS STS Block Config', () => {
  it('has the correct block type', () => {
    expect(StsBlock.type).toBe('sts')
  })

  it("is in the 'tools' category", () => {
    expect(StsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(StsBlock.tools.access.length).toBeGreaterThan(0)
    expect(StsBlock.tools.access).toContain('sts_get_caller_identity')
    expect(StsBlock.tools.access).toContain('sts_get_session_token')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of StsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(StsBlock.name).toBeTruthy()
    expect(StsBlock.description).toBeTruthy()
  })
})
