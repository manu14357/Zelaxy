import { describe, expect, it } from 'vitest'
import type { BlockConfig, SubBlockConfig } from '@/blocks/types'
import { lintWorkflowState, validateBlockSubBlocks, validateValueForSubBlock } from './validation'

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
    [
      'agent',
      {
        type: 'agent',
        category: 'blocks',
        subBlocks: [],
        outputs: { content: {}, context: {} },
      } as any,
    ],
    ['jina', { type: 'jina', category: 'tools', subBlocks: [], outputs: { content: {} } } as any],
    [
      'function',
      { type: 'function', category: 'blocks', subBlocks: [], outputs: { result: {} } } as any,
    ],
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

  it('flags a {{block.field}} reference to a block that does not exist', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      b: {
        type: 'agent',
        name: 'Step',
        subBlocks: { userPrompt: { value: 'Summarize: {{search_sk.content}}' } },
      },
    }
    const edges = [{ source: 'a', target: 'b' }]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.severity === 'warning' && i.message.includes('search_sk'))).toBe(
      true
    )
  })

  it('accepts a {{block.field}} reference matching a block id or normalized name', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      scrape: { type: 'agent', name: 'Scrape SK', subBlocks: {} },
      b: {
        type: 'agent',
        name: 'Step',
        // `scrape` matches the block id; `scrapesk` matches normalized name "Scrape SK".
        subBlocks: { userPrompt: { value: '{{scrape.content}} and {{scrapesk.content}}' } },
      },
    }
    const edges = [
      { source: 'a', target: 'scrape' },
      { source: 'scrape', target: 'b' },
    ]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.message.includes('references'))).toBe(false)
  })

  it('does not flag bare {{ENV_VAR}} (no dot) as a block reference', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      b: { type: 'agent', name: 'Step', subBlocks: { apiKey: { value: '{{OPENAI_API_KEY}}' } } },
    }
    const edges = [{ source: 'a', target: 'b' }]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.message.includes('references'))).toBe(false)
  })

  it('flags a {{block.field}} reference to a field the block does not output', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      jina_web: { type: 'jina', name: 'Scrape', subBlocks: {} },
      b: {
        type: 'agent',
        name: 'Step',
        subBlocks: { userPrompt: { value: '{{jina_web.context}}' } },
      },
    }
    const edges = [
      { source: 'a', target: 'jina_web' },
      { source: 'jina_web', target: 'b' },
    ]
    const issues = lintWorkflowState(blocks, edges, registry)
    // jina outputs `content`, not `context`.
    expect(issues.some((i) => i.message.includes('context') && i.message.includes('content'))).toBe(
      true
    )
  })

  it('accepts a valid output field (agent.context is real)', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      ag: { type: 'agent', name: 'Brain', subBlocks: {} },
      b: { type: 'agent', name: 'Step', subBlocks: { userPrompt: { value: '{{ag.context}}' } } },
    }
    const edges = [
      { source: 'a', target: 'ag' },
      { source: 'ag', target: 'b' },
    ]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.message.includes('not an output'))).toBe(false)
  })

  it('does not field-validate a function block (dynamic output)', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      fn: { type: 'function', name: 'Fmt', subBlocks: {} },
      b: { type: 'agent', name: 'Step', subBlocks: { userPrompt: { value: '{{fn.anything}}' } } },
    }
    const edges = [
      { source: 'a', target: 'fn' },
      { source: 'fn', target: 'b' },
    ]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.message.includes('not an output'))).toBe(false)
  })

  // Regression: an agent with responseFormat set has NO `.content` at runtime — the parsed schema's
  // top-level fields replace it directly on the output (AgentBlockHandler.processStructuredResponse).
  // A workflow that references `.content` on such a block "builds" clean but fails at execution with
  // `JSON.parse("undefined")` — the lint must catch this at build time, not wave it through.
  const responseFormatValue = JSON.stringify({
    name: 'football_news',
    schema: {
      type: 'object',
      properties: { articles: { type: 'array' } },
      required: ['articles'],
    },
  })

  it('accepts a schema field reference on an agent block with responseFormat set', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      ag: {
        type: 'agent',
        name: 'Extract',
        subBlocks: { responseFormat: { value: responseFormatValue } },
      },
      b: { type: 'agent', name: 'Step', subBlocks: { userPrompt: { value: '{{ag.articles}}' } } },
    }
    const edges = [
      { source: 'a', target: 'ag' },
      { source: 'ag', target: 'b' },
    ]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(issues.some((i) => i.message.includes('not an output'))).toBe(false)
  })

  it('flags a `.content` reference on an agent block with responseFormat set', () => {
    const blocks = {
      a: { type: 'starter', name: 'Start', subBlocks: {} },
      ag: {
        type: 'agent',
        name: 'Extract',
        subBlocks: { responseFormat: { value: responseFormatValue } },
      },
      b: { type: 'agent', name: 'Step', subBlocks: { userPrompt: { value: '{{ag.content}}' } } },
    }
    const edges = [
      { source: 'a', target: 'ag' },
      { source: 'ag', target: 'b' },
    ]
    const issues = lintWorkflowState(blocks, edges, registry)
    expect(
      issues.some((i) => i.message.includes('content') && i.message.includes('not an output'))
    ).toBe(true)
  })
})
