/**
 * Config tests for the Manual Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ManualTriggerBlock } from '@/blocks/blocks/manual_trigger'

describe('Manual Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(ManualTriggerBlock.type).toBe('manual_trigger')
  })

  it("is in the 'triggers' category", () => {
    expect(ManualTriggerBlock.category).toBe('triggers')
  })

  it('has no registry tools (entry-point trigger, executed by the trigger handler)', () => {
    expect(ManualTriggerBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ManualTriggerBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has no runtime outputs (trigger entry-point)', () => {
    expect(Object.keys(ManualTriggerBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(ManualTriggerBlock.name).toBeTruthy()
    expect(ManualTriggerBlock.description).toBeTruthy()
  })
})
