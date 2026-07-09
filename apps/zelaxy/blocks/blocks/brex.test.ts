/**
 * Config tests for the Brex block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BrexBlock } from '@/blocks/blocks/brex'

describe('Brex Block Config', () => {
  it('has the correct block type', () => {
    expect(BrexBlock.type).toBe('brex')
  })

  it("is in the 'tools' category", () => {
    expect(BrexBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(BrexBlock.tools.access.length).toBeGreaterThan(0)
    expect(BrexBlock.tools.access).toContain('brex_list_cash_accounts')
    expect(BrexBlock.tools.access).toContain('brex_list_users')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of BrexBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(BrexBlock.name).toBeTruthy()
    expect(BrexBlock.description).toBeTruthy()
  })
})
