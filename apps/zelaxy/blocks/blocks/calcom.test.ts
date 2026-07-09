/**
 * Config tests for the Cal.com block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CalcomBlock } from '@/blocks/blocks/calcom'

describe('Cal.com Block Config', () => {
  it('has the correct block type', () => {
    expect(CalcomBlock.type).toBe('calcom')
  })

  it("is in the 'tools' category", () => {
    expect(CalcomBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CalcomBlock.tools.access.length).toBeGreaterThan(0)
    expect(CalcomBlock.tools.access).toContain('calcom_list_bookings')
    expect(CalcomBlock.tools.access).toContain('calcom_create_booking')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CalcomBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CalcomBlock.name).toBeTruthy()
    expect(CalcomBlock.description).toBeTruthy()
  })
})
