/**
 * Config tests for the Calendly block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CalendlyBlock } from '@/blocks/blocks/calendly'

describe('Calendly Block Config', () => {
  it('has the correct block type', () => {
    expect(CalendlyBlock.type).toBe('calendly')
  })

  it("is in the 'tools' category", () => {
    expect(CalendlyBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CalendlyBlock.tools.access.length).toBeGreaterThan(0)
    expect(CalendlyBlock.tools.access).toContain('calendly_get_current_user')
    expect(CalendlyBlock.tools.access).toContain('calendly_list_event_types')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CalendlyBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CalendlyBlock.name).toBeTruthy()
    expect(CalendlyBlock.description).toBeTruthy()
  })
})
