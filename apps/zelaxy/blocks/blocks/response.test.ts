/**
 * Config tests for the Response block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ResponseBlock } from '@/blocks/blocks/response'

describe('Response Block Config', () => {
  it('has the correct block type', () => {
    expect(ResponseBlock.type).toBe('response')
  })

  it("is in the 'blocks' category", () => {
    expect(ResponseBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(ResponseBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ResponseBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(ResponseBlock.inputs.dataMode).toBeDefined()
    expect(ResponseBlock.inputs.builderData).toBeDefined()
    expect(ResponseBlock.inputs.data).toBeDefined()
    expect(ResponseBlock.inputs.status).toBeDefined()
    expect(ResponseBlock.inputs.headers).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(ResponseBlock.outputs.data).toBeDefined()
    expect(ResponseBlock.outputs.status).toBeDefined()
    expect(ResponseBlock.outputs.headers).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ResponseBlock.name).toBeTruthy()
    expect(ResponseBlock.description).toBeTruthy()
  })
})
