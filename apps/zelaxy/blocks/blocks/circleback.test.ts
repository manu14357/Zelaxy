/**
 * Config tests for the Circleback Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CirclebackBlock } from '@/blocks/blocks/circleback'

describe('Circleback Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(CirclebackBlock.type).toBe('circleback')
  })

  it("is in the 'triggers' category", () => {
    expect(CirclebackBlock.category).toBe('triggers')
  })

  it('has no registry tools (entry-point trigger, executed by the trigger handler)', () => {
    expect(CirclebackBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CirclebackBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(CirclebackBlock.outputs.id).toBeDefined()
    expect(CirclebackBlock.outputs.name).toBeDefined()
    expect(CirclebackBlock.outputs.url).toBeDefined()
    expect(CirclebackBlock.outputs.attendees).toBeDefined()
    expect(CirclebackBlock.outputs.notes).toBeDefined()
    expect(CirclebackBlock.outputs.actionItems).toBeDefined()
    expect(CirclebackBlock.outputs.transcript).toBeDefined()
    expect(CirclebackBlock.outputs.meeting).toBeDefined()
  })

  it('has a name and description', () => {
    expect(CirclebackBlock.name).toBeTruthy()
    expect(CirclebackBlock.description).toBeTruthy()
  })
})
