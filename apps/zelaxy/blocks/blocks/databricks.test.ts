/**
 * Config tests for the Databricks block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DatabricksBlock } from '@/blocks/blocks/databricks'

describe('Databricks Block Config', () => {
  it('has the correct block type', () => {
    expect(DatabricksBlock.type).toBe('databricks')
  })

  it("is in the 'tools' category", () => {
    expect(DatabricksBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DatabricksBlock.tools.access.length).toBeGreaterThan(0)
    expect(DatabricksBlock.tools.access).toContain('databricks_execute_sql')
    expect(DatabricksBlock.tools.access).toContain('databricks_list_jobs')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DatabricksBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DatabricksBlock.name).toBeTruthy()
    expect(DatabricksBlock.description).toBeTruthy()
  })
})
