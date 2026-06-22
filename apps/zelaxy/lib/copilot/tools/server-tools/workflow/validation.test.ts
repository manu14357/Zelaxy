import { describe, expect, it } from 'vitest'
import type { BlockConfig, SubBlockConfig } from '@/blocks/types'
import {
  lintWorkflowState,
  validateBlockSubBlocks,
  validateValueForSubBlock,
} from './validation'

function sub(overrides: Partial<SubBlockConfig>): SubBlockConfig {
  return { id: 'x', type: 'short-input', ...overrides } as SubBlockConfig
}

describe('validateValueForSubBlock', () => {
  it('rejects a dropdown value not in options', () => {
    const cfg = sub({
      id: 'scheduleType',
      type: 'dropdown',
      options: [
        { label: 'Hourly', id: 'hourly' },
        { label: 'Daily', id: 'daily' },
      ],
    })
    const res = validateValueForSubBlock(cfg, 'every-2-hour')
    expect(res.error).toContain('invalid value')
    expect(res.error).toContain('hourly')
  })

  it('accepts a valid dropdown value', () => {
    const cfg = sub({ id: 't', type: 'dropdown', options: [{ label: 'A', id: 'a' }] })
    expect(validateValueForSubBlock(cfg, 'a').error).toBeUndefined()
  })

  it('coerces switch strings to booleans', () => {
    const cfg = sub({ id: 's', type: 'switch' })
    expect(validateValueForSubBlock(cfg, 'true').value).toBe(true)
    expect(validateValueForSubBlock(cfg, 'false').value).toBe(false)
  })

  it('clamps a slider to its range and flags it', () => {
    const cfg = sub({ id: 'temp', type: 'slider', min: 0, max: 2 })
    const res = validateValueForSubBlock(cfg, 9)
    expect(res.value).toBe(2)
    expect(res.error).toContain('max 2')
  })

  it('rounds integer sliders', () => {
    const cfg = sub({ id: 'n', type: 'slider', min: 1, max: 10, integer: true })
    expect(validateValueForSubBlock(cfg, 3.7).value).toBe(4)
  })
})

describe('validateBlockSubBlocks', () => {
  it('normalizes values in place and reports errors', () => {
    const blockConfig = {
      subBlocks: [sub({ id: 'on', type: 'switch' })],
    } as unknown as BlockConfig
    const subBlocks = { on: { id: 'on', type: 'switch', value: 'true' } }
    const errors = validateBlockSubBlocks('agent', blockConfig, subBlocks)
    expect(errors).toHaveLength(0)
    expect(subBlocks.on.value).toBe(true)
  })
})

describe('lintWorkflowState', () => {
  const registry = new Map<string, BlockConfig>([
    ['starter', { type: 'starter', category: 'triggers', subBlocks: [] } as any],
    ['agent', { type: 'agent', category: 'blocks', subBlocks: [] } as any],
  ])

  it('flags an edge to a missing block', () => {
    const blocks = { a: { type: 'starter', subBlocks: {} }, b: { type: 'agent', subBlocks: {} } }
    const edges = [{ source: 'a', target: 'ghost' }]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('ghost'))).toBe(true)
  })

  it('flags a disconnected non-trigger block', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      b: { type: 'agent', name: 'Lonely', subBlocks: {} },
    }
    const issues = lintWorkflowState(blocks, [], registry)
    expect(issues.some((i) => i.message.includes('Lonely'))).toBe(true)
  })

  it('passes a clean linear workflow', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      b: { type: 'agent', name: 'Step', subBlocks: {} },
    }
    const edges = [{ source: 'a', target: 'b' }]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues).toHaveLength(0)
  })
})
