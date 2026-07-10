/**
 * Config tests for the ClickHouse block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ClickhouseBlock } from '@/blocks/blocks/clickhouse'

describe('ClickHouse Block Config', () => {
  it('has the correct block type', () => {
    expect(ClickhouseBlock.type).toBe('clickhouse')
  })

  it("is in the 'tools' category", () => {
    expect(ClickhouseBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ClickhouseBlock.tools.access.length).toBeGreaterThan(0)
    expect(ClickhouseBlock.tools.access).toContain('clickhouse_query')
    expect(ClickhouseBlock.tools.access).toContain('clickhouse_ping')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ClickhouseBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ClickhouseBlock.name).toBeTruthy()
    expect(ClickhouseBlock.description).toBeTruthy()
  })
})
