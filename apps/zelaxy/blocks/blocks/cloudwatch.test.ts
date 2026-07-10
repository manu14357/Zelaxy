/**
 * Config tests for the CloudWatch block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CloudWatchBlock } from '@/blocks/blocks/cloudwatch'

describe('CloudWatch Block Config', () => {
  it('has the correct block type', () => {
    expect(CloudWatchBlock.type).toBe('cloudwatch')
  })

  it("is in the 'tools' category", () => {
    expect(CloudWatchBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CloudWatchBlock.tools.access.length).toBeGreaterThan(0)
    expect(CloudWatchBlock.tools.access).toContain('cloudwatch_query_logs')
    expect(CloudWatchBlock.tools.access).toContain('cloudwatch_list_metrics')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CloudWatchBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CloudWatchBlock.name).toBeTruthy()
    expect(CloudWatchBlock.description).toBeTruthy()
  })
})
