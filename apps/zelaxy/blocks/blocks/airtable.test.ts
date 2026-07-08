/**
 * Config tests for the Airtable block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AirtableBlock } from '@/blocks/blocks/airtable'

describe('Airtable Block Config', () => {
  it('has the correct block type', () => {
    expect(AirtableBlock.type).toBe('airtable')
  })

  it("is in the 'tools' category", () => {
    expect(AirtableBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AirtableBlock.tools.access.length).toBeGreaterThan(0)
    expect(AirtableBlock.tools.access).toContain('airtable_create_records')
    expect(AirtableBlock.tools.access).toContain('airtable_list_records')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AirtableBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AirtableBlock.name).toBeTruthy()
    expect(AirtableBlock.description).toBeTruthy()
  })
})
