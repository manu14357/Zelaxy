/**
 * Config tests for the Loop block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { LoopBlock } from '@/blocks/blocks/loop'

describe('Loop Block Config', () => {
  it('has the correct block type', () => {
    expect(LoopBlock.type).toBe('loop')
  })

  it("is in the 'blocks' category", () => {
    expect(LoopBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(LoopBlock.tools.access).toEqual([])
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = LoopBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('loopType')
    expect(ids).toContain('count')
    expect(ids).toContain('collection')
    expect(ids).toContain('maxIterations')
    expect(ids).toContain('parallelExecution')
    expect(ids).toContain('stopOnError')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of LoopBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(LoopBlock.outputs.iterations).toBeDefined()
    expect(LoopBlock.outputs.results).toBeDefined()
    expect(LoopBlock.outputs.executionTime).toBeDefined()
    expect(LoopBlock.outputs.status).toBeDefined()
    expect(LoopBlock.outputs.currentIteration).toBeDefined()
    expect(LoopBlock.outputs.currentItem).toBeDefined()
  })

  it('has a name and description', () => {
    expect(LoopBlock.name).toBeTruthy()
    expect(LoopBlock.description).toBeTruthy()
  })
})
