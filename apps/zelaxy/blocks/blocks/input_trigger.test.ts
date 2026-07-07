/**
 * Config tests for the Input Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { InputTriggerBlock } from '@/blocks/blocks/input_trigger'

describe('Input Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(InputTriggerBlock.type).toBe('input_trigger')
  })

  it("is in the 'triggers' category", () => {
    expect(InputTriggerBlock.category).toBe('triggers')
  })

  it('has no registry tools (entry-point trigger, executed by the trigger handler)', () => {
    expect(InputTriggerBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of InputTriggerBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has no runtime outputs (trigger entry-point)', () => {
    expect(Object.keys(InputTriggerBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(InputTriggerBlock.name).toBeTruthy()
    expect(InputTriggerBlock.description).toBeTruthy()
  })
})
