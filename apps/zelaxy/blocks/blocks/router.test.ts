/**
 * Config tests for the Router block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { RouterBlock } from '@/blocks/blocks/router'

describe('Router Block Config', () => {
  it('has the correct block type', () => {
    expect(RouterBlock.type).toBe('router')
  })

  it("is in the 'blocks' category", () => {
    expect(RouterBlock.category).toBe('blocks')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of RouterBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(RouterBlock.inputs.prompt).toBeDefined()
    expect(RouterBlock.inputs.model).toBeDefined()
    expect(RouterBlock.inputs.apiKey).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(RouterBlock.outputs.content).toBeDefined()
    expect(RouterBlock.outputs.model).toBeDefined()
    expect(RouterBlock.outputs.tokens).toBeDefined()
    expect(RouterBlock.outputs.cost).toBeDefined()
    expect(RouterBlock.outputs.selectedPath).toBeDefined()
  })

  it('has a name and description', () => {
    expect(RouterBlock.name).toBeTruthy()
    expect(RouterBlock.description).toBeTruthy()
  })
})
