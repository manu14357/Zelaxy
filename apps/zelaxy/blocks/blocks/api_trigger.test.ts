/**
 * Config tests for the API Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ApiTriggerBlock } from '@/blocks/blocks/api_trigger'

describe('API Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(ApiTriggerBlock.type).toBe('api_trigger')
  })

  it("is in the 'triggers' category", () => {
    expect(ApiTriggerBlock.category).toBe('triggers')
  })

  it('has no registry tools (entry-point trigger, executed by the trigger handler)', () => {
    expect(ApiTriggerBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ApiTriggerBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(ApiTriggerBlock.outputs.input).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ApiTriggerBlock.name).toBeTruthy()
    expect(ApiTriggerBlock.description).toBeTruthy()
  })
})
