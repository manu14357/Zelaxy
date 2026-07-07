/**
 * Config tests for the Memory block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { MemoryBlock } from '@/blocks/blocks/memory'

describe('Memory Block Config', () => {
  it('has the correct block type', () => {
    expect(MemoryBlock.type).toBe('memory')
  })

  it("is in the 'blocks' category", () => {
    expect(MemoryBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(MemoryBlock.tools.access).toContain('memory_add')
    expect(MemoryBlock.tools.access).toContain('memory_get')
    expect(MemoryBlock.tools.access).toContain('memory_get_all')
    expect(MemoryBlock.tools.access).toContain('memory_delete')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of MemoryBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(MemoryBlock.inputs.operation).toBeDefined()
    expect(MemoryBlock.inputs.id).toBeDefined()
    expect(MemoryBlock.inputs.role).toBeDefined()
    expect(MemoryBlock.inputs.content).toBeDefined()
    expect(MemoryBlock.inputs.limit).toBeDefined()
    expect(MemoryBlock.inputs.sortOrder).toBeDefined()
    expect(MemoryBlock.inputs.filterType).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(MemoryBlock.outputs.memories).toBeDefined()
    expect(MemoryBlock.outputs.id).toBeDefined()
    expect(MemoryBlock.outputs.count).toBeDefined()
    expect(MemoryBlock.outputs.success).toBeDefined()
  })

  it('resolves the correct tool per operation', () => {
    const tool = MemoryBlock.tools.config!.tool
    expect(tool({ operation: 'add' })).toBe('memory_add')
    expect(tool({ operation: 'get' })).toBe('memory_get')
    expect(tool({ operation: 'getAll' })).toBe('memory_get_all')
    expect(tool({ operation: 'delete' })).toBe('memory_delete')
    expect(tool({})).toBe('memory_add')
  })

  it('has a name and description', () => {
    expect(MemoryBlock.name).toBeTruthy()
    expect(MemoryBlock.description).toBeTruthy()
  })
})
