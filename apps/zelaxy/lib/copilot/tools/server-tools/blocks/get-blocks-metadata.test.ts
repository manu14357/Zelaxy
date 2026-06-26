import { describe, expect, it } from 'vitest'
import { buildYamlExample, extractDocForAgent } from './get-blocks-metadata'

// Mock metadata shaped like the schedule block (a display-only field + conditional timing fields).
const scheduleMeta = {
  name: 'Schedule',
  subBlocks: [
    { id: 'scheduleConfig', type: 'schedule-config' },
    {
      id: 'scheduleType',
      type: 'dropdown',
      options: [
        { label: 'Every X Minutes', id: 'minutes' },
        { label: 'Hourly', id: 'hourly' },
        { label: 'Daily', id: 'daily' },
      ],
    },
    {
      id: 'minutesInterval',
      type: 'short-input',
      condition: { field: 'scheduleType', value: 'minutes' },
    },
    {
      id: 'hourlyMinute',
      type: 'short-input',
      condition: { field: 'scheduleType', value: 'hourly' },
    },
    { id: 'dailyTime', type: 'short-input', condition: { field: 'scheduleType', value: 'daily' } },
    { id: 'timezone', type: 'dropdown', options: [{ label: 'UTC', id: 'UTC' }] },
  ],
}

describe('buildYamlExample', () => {
  it('drops display-only fields and keeps only conditional fields whose condition matches', () => {
    const ex = buildYamlExample('schedule', scheduleMeta)
    expect(ex).toContain('type: schedule')
    expect(ex).not.toContain('scheduleConfig:') // schedule-config is a status widget, not an input
    expect(ex).toContain('scheduleType: "minutes"') // dropdown → first option
    expect(ex).toContain('minutesInterval:') // condition scheduleType=minutes ✓
    expect(ex).not.toContain('hourlyMinute:') // gated on scheduleType=hourly ✗
    expect(ex).not.toContain('dailyTime:')
    expect(ex).toContain('timezone: "UTC"') // unconditional ✓
    expect(ex).toContain('outgoing:')
    expect(ex).toContain('target: <next-block-id>')
  })

  it('handles a block with no sub-blocks', () => {
    const ex = buildYamlExample('manual', { name: 'Manual', subBlocks: [] })
    expect(ex).toContain('type: manual')
    expect(ex).not.toContain('inputs:')
    expect(ex).toContain('outgoing:')
  })
})

describe('extractDocForAgent', () => {
  // Mirrors a real block doc: SHORT intro, then a very long low-priority "When to Use" prose block,
  // with the high-value Configuration + YAML Example sitting AFTER it — exactly the layout the old
  // top-chop truncation broke (it kept the prose and dropped Configuration/Example).
  const longProse = '- use case use case use case lorem ipsum dolor. '.repeat(120) // ~5.7k chars
  const doc = `---
title: Sample Block
description: A sample
---

# Sample Block

A short one-line intro about the sample block.

## Overview

| Property | Value |
|----------|-------|
| **Type** | \`sample\` |

## When to Use

${longProse}

## Configuration

### Operation
The CONFIG_MARKER_OPERATION field with options foo and bar.

## Inputs & Outputs

- Inputs: OUTPUT_MARKER_input
- Outputs: OUTPUT_MARKER_output

## YAML Example

\`\`\`yaml
sample_1:
  type: sample
  inputs:
    operation: "YAML_MARKER_value"
\`\`\`
`

  it('returns the doc unchanged when under budget', () => {
    const small = '# Tiny\n\nshort doc'
    expect(extractDocForAgent(small)).toBe(small)
  })

  it('keeps Configuration and YAML Example even when they sit after a long prose section', () => {
    const out = extractDocForAgent(doc, 1500)
    // The two sections the agent needs MUST survive — the old top-chop logic dropped both.
    expect(out).toContain('CONFIG_MARKER_OPERATION')
    expect(out).toContain('YAML_MARKER_value')
    // Frontmatter/title head is always retained.
    expect(out).toContain('title: Sample Block')
    // Result respects the budget (with a little slack for the omission marker).
    expect(out.length).toBeLessThan(1500 + 200)
  })

  it('drops lower-priority prose sections first and notes the omission', () => {
    const out = extractDocForAgent(doc, 1500)
    // The giant "When to Use" prose is the lowest priority and should be cut.
    expect(out).not.toContain('use case use case use case')
    expect(out).toContain('omitted to fit context')
  })
})
