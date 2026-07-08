/**
 * Config tests for the Asana block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AsanaBlock } from '@/blocks/blocks/asana'

describe('Asana Block Config', () => {
  it('has the correct block type', () => {
    expect(AsanaBlock.type).toBe('asana')
  })

  it("is in the 'tools' category", () => {
    expect(AsanaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AsanaBlock.tools.access.length).toBeGreaterThan(0)
    expect(AsanaBlock.tools.access).toContain('asana_get_task')
    expect(AsanaBlock.tools.access).toContain('asana_create_task')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AsanaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AsanaBlock.name).toBeTruthy()
    expect(AsanaBlock.description).toBeTruthy()
  })
})
