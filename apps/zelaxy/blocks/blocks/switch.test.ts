/**
 * Tests for Switch/Case block definition
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { SwitchBlock } from '@/blocks/blocks/switch'

describe('Switch Block Config', () => {
  it('should have correct block type', () => {
    expect(SwitchBlock.type).toBe('switch')
  })

  it('should be in blocks category', () => {
    expect(SwitchBlock.category).toBe('blocks')
  })

  it('should have no tool access (deterministic, no LLM)', () => {
    expect(SwitchBlock.tools.access).toEqual([])
  })

  it('should have value and cases sub-blocks', () => {
    const ids = SwitchBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('value')
    expect(ids).toContain('cases')
  })

  it('should have value as required short-input', () => {
    const valueBlock = SwitchBlock.subBlocks.find((sb) => sb.id === 'value')
    expect(valueBlock).toBeDefined()
    expect(valueBlock!.type).toBe('short-input')
    expect(valueBlock!.required).toBe(true)
  })

  it('should have cases as switch-case-input', () => {
    const casesBlock = SwitchBlock.subBlocks.find((sb) => sb.id === 'cases')
    expect(casesBlock).toBeDefined()
    expect(casesBlock!.type).toBe('switch-case-input')
  })

  it('should define expected outputs', () => {
    expect(SwitchBlock.outputs.matchedValue).toBeDefined()
    expect(SwitchBlock.outputs.selectedCaseId).toBeDefined()
    expect(SwitchBlock.outputs.selectedPath).toBeDefined()
    expect(SwitchBlock.outputs.inputValue).toBeDefined()
  })

  it('should have purple background color', () => {
    expect(SwitchBlock.bgColor).toBe('#8B5CF6')
  })

  it('should have a name and description', () => {
    expect(SwitchBlock.name).toBe('Switch')
    expect(SwitchBlock.description).toBeTruthy()
    expect(SwitchBlock.longDescription).toBeTruthy()
  })

  it('should have docs link', () => {
    expect(SwitchBlock.docsLink).toBe('/docs/blocks/switch')
  })
})
