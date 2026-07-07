/**
 * Config tests for the Start Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { StartTriggerBlock } from '@/blocks/blocks/start_trigger'

describe('Start Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(StartTriggerBlock.type).toBe('start_trigger')
  })

  it("is in the 'triggers' category", () => {
    expect(StartTriggerBlock.category).toBe('triggers')
  })

  it('has no registry tools (trigger entry-point)', () => {
    expect(StartTriggerBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of StartTriggerBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has no static runtime outputs (trigger)', () => {
    expect(Object.keys(StartTriggerBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(StartTriggerBlock.name).toBeTruthy()
    expect(StartTriggerBlock.description).toBeTruthy()
  })
})
