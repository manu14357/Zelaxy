/**
 * Config tests for the Datadog block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DatadogBlock } from '@/blocks/blocks/datadog'

describe('Datadog Block Config', () => {
  it('has the correct block type', () => {
    expect(DatadogBlock.type).toBe('datadog')
  })

  it("is in the 'tools' category", () => {
    expect(DatadogBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DatadogBlock.tools.access.length).toBeGreaterThan(0)
    expect(DatadogBlock.tools.access).toContain('datadog_query_metrics')
    expect(DatadogBlock.tools.access).toContain('datadog_list_monitors')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DatadogBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DatadogBlock.name).toBeTruthy()
    expect(DatadogBlock.description).toBeTruthy()
  })
})
