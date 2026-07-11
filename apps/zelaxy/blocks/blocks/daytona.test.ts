/**
 * Config tests for the Daytona block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DaytonaBlock } from '@/blocks/blocks/daytona'

describe('Daytona Block Config', () => {
  it('has the correct block type', () => {
    expect(DaytonaBlock.type).toBe('daytona')
  })

  it("is in the 'tools' category", () => {
    expect(DaytonaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DaytonaBlock.tools.access.length).toBeGreaterThan(0)
    expect(DaytonaBlock.tools.access).toContain('daytona_list_workspaces')
    expect(DaytonaBlock.tools.access).toContain('daytona_create_workspace')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DaytonaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DaytonaBlock.name).toBeTruthy()
    expect(DaytonaBlock.description).toBeTruthy()
  })
})
