/**
 * Config tests for the Datagma block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DatagmaBlock } from '@/blocks/blocks/datagma'

describe('Datagma Block Config', () => {
  it('has the correct block type', () => {
    expect(DatagmaBlock.type).toBe('datagma')
  })

  it("is in the 'tools' category", () => {
    expect(DatagmaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DatagmaBlock.tools.access.length).toBeGreaterThan(0)
    expect(DatagmaBlock.tools.access).toContain('datagma_enrich_person')
    expect(DatagmaBlock.tools.access).toContain('datagma_find_email')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DatagmaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DatagmaBlock.name).toBeTruthy()
    expect(DatagmaBlock.description).toBeTruthy()
  })
})
