/**
 * Tests for Wait / Delay block definition
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DelayBlock } from '@/blocks/blocks/delay'

describe('Delay Block Config', () => {
  it('should have correct block type', () => {
    expect(DelayBlock.type).toBe('delay')
  })

  it('should be in block category', () => {
    expect(DelayBlock.category).toBe('blocks')
  })

  it('should reference the delay_wait tool', () => {
    expect(DelayBlock.tools.access).toContain('delay_wait')
  })

  it('should have duration and unit sub-blocks', () => {
    const ids = DelayBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('duration')
    expect(ids).toContain('unit')
  })

  it('should have duration as required short-input', () => {
    const durationBlock = DelayBlock.subBlocks.find((sb) => sb.id === 'duration')
    expect(durationBlock).toBeDefined()
    expect(durationBlock!.type).toBe('short-input')
    expect(durationBlock!.required).toBe(true)
  })

  it('should have unit as dropdown with correct options', () => {
    const unitBlock = DelayBlock.subBlocks.find((sb) => sb.id === 'unit')
    expect(unitBlock).toBeDefined()
    expect(unitBlock!.type).toBe('dropdown')

    const options = unitBlock!.options as { label: string; id: string }[]
    const optionIds = options.map((o) => o.id)
    expect(optionIds).toContain('seconds')
    expect(optionIds).toContain('minutes')
    expect(optionIds).toContain('hours')
  })

  it('should default unit to seconds', () => {
    const unitBlock = DelayBlock.subBlocks.find((sb) => sb.id === 'unit')
    expect(unitBlock!.value!({})).toBe('seconds')
  })

  it('should have tools.config.tool that returns delay_wait', () => {
    expect(DelayBlock.tools.config).toBeDefined()
    expect(DelayBlock.tools.config!.tool({})).toBe('delay_wait')
  })

  it('should transform params correctly', () => {
    const result = DelayBlock.tools.config!.params!({ duration: '10', unit: 'minutes' })
    expect(result).toEqual({ duration: 10, unit: 'minutes' })
  })

  it('should define expected inputs', () => {
    expect(DelayBlock.inputs.duration).toBeDefined()
    expect(DelayBlock.inputs.unit).toBeDefined()
  })

  it('should define expected outputs', () => {
    expect(DelayBlock.outputs.delayed).toBeDefined()
    expect(DelayBlock.outputs.delayMs).toBeDefined()
    expect(DelayBlock.outputs.startedAt).toBeDefined()
    expect(DelayBlock.outputs.completedAt).toBeDefined()
  })
})
