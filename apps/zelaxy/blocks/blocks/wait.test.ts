/**
 * Config tests for the Wait block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { WaitBlock } from '@/blocks/blocks/wait'

describe('Wait Block Config', () => {
  it('has the correct block type', () => {
    expect(WaitBlock.type).toBe('wait')
  })

  it("is in the 'blocks' category", () => {
    expect(WaitBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(WaitBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of WaitBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(WaitBlock.inputs.duration).toBeDefined()
    expect(WaitBlock.inputs.unit).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(WaitBlock.outputs.waitedMs).toBeDefined()
    expect(WaitBlock.outputs.resumedAt).toBeDefined()
    expect(WaitBlock.outputs.mode).toBeDefined()
  })

  it('has a name and description', () => {
    expect(WaitBlock.name).toBeTruthy()
    expect(WaitBlock.description).toBeTruthy()
  })
})
