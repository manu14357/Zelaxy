/**
 * Config tests for the Schedule Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ScheduleBlock } from '@/blocks/blocks/schedule'

describe('Schedule Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(ScheduleBlock.type).toBe('schedule')
  })

  it("is in the 'triggers' category", () => {
    expect(ScheduleBlock.category).toBe('triggers')
  })

  it('has no registry tools (entry-point trigger, executed by the trigger handler)', () => {
    expect(ScheduleBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ScheduleBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has no runtime outputs (trigger entry-point)', () => {
    expect(Object.keys(ScheduleBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(ScheduleBlock.name).toBeTruthy()
    expect(ScheduleBlock.description).toBeTruthy()
  })
})
