/**
 * Config tests for the Function block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { FunctionBlock } from '@/blocks/blocks/function'

describe('Function Block Config', () => {
  it('has the correct block type', () => {
    expect(FunctionBlock.type).toBe('function')
  })

  it("is in the 'blocks' category", () => {
    expect(FunctionBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(FunctionBlock.tools.access).toContain('function_execute')
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = FunctionBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('code')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of FunctionBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(FunctionBlock.outputs.result).toBeDefined()
    expect(FunctionBlock.outputs.stdout).toBeDefined()
  })

  it('has a name and description', () => {
    expect(FunctionBlock.name).toBeTruthy()
    expect(FunctionBlock.description).toBeTruthy()
  })
})
