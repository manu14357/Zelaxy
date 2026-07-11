/**
 * Config tests for the Google Calendar block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GoogleCalendarBlock } from '@/blocks/blocks/google_calendar'

describe('Google Calendar Block Config', () => {
  it('has the correct block type', () => {
    expect(GoogleCalendarBlock.type).toBe('google_calendar')
  })

  it("is in the 'tools' category", () => {
    expect(GoogleCalendarBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GoogleCalendarBlock.tools.access.length).toBeGreaterThan(0)
    expect(GoogleCalendarBlock.tools.access).toContain('google_calendar_create')
    expect(GoogleCalendarBlock.tools.access).toContain('google_calendar_list')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GoogleCalendarBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GoogleCalendarBlock.name).toBeTruthy()
    expect(GoogleCalendarBlock.description).toBeTruthy()
  })
})
