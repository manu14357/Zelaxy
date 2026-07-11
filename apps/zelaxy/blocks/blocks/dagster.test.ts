/**
 * Config tests for the Dagster block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DagsterBlock } from '@/blocks/blocks/dagster'

describe('Dagster Block Config', () => {
  it('has the correct block type', () => {
    expect(DagsterBlock.type).toBe('dagster')
  })

  it("is in the 'tools' category", () => {
    expect(DagsterBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DagsterBlock.tools.access.length).toBeGreaterThan(0)
    expect(DagsterBlock.tools.access).toContain('dagster_launch_run')
    expect(DagsterBlock.tools.access).toContain('dagster_list_runs')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DagsterBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DagsterBlock.name).toBeTruthy()
    expect(DagsterBlock.description).toBeTruthy()
  })
})
