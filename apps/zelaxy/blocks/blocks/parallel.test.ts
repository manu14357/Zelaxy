/**
 * Config tests for the Parallel block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ParallelBlock } from '@/blocks/blocks/parallel'

describe('Parallel Block Config', () => {
  it('has the correct block type', () => {
    expect(ParallelBlock.type).toBe('parallel')
  })

  it("is in the 'blocks' category", () => {
    expect(ParallelBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(ParallelBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ParallelBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(ParallelBlock.inputs.collection).toBeDefined()
    expect(ParallelBlock.inputs.count).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(ParallelBlock.outputs.executions).toBeDefined()
    expect(ParallelBlock.outputs.results).toBeDefined()
    expect(ParallelBlock.outputs.executionTime).toBeDefined()
    expect(ParallelBlock.outputs.status).toBeDefined()
    expect(ParallelBlock.outputs.currentExecution).toBeDefined()
    expect(ParallelBlock.outputs.currentItem).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ParallelBlock.name).toBeTruthy()
    expect(ParallelBlock.description).toBeTruthy()
  })
})
