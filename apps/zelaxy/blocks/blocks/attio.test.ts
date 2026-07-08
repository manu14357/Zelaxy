/**
 * Config tests for the Attio block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AttioBlock } from '@/blocks/blocks/attio'

describe('Attio Block Config', () => {
  it('has the correct block type', () => {
    expect(AttioBlock.type).toBe('attio')
  })

  it("is in the 'tools' category", () => {
    expect(AttioBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AttioBlock.tools.access.length).toBeGreaterThan(0)
    expect(AttioBlock.tools.access).toContain('attio_list_records')
    expect(AttioBlock.tools.access).toContain('attio_create_record')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AttioBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AttioBlock.name).toBeTruthy()
    expect(AttioBlock.description).toBeTruthy()
  })
})
