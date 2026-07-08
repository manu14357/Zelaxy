/**
 * Config tests for the Athena block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AthenaBlock } from '@/blocks/blocks/athena'

describe('Athena Block Config', () => {
  it('has the correct block type', () => {
    expect(AthenaBlock.type).toBe('athena')
  })

  it("is in the 'tools' category", () => {
    expect(AthenaBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AthenaBlock.tools.access.length).toBeGreaterThan(0)
    expect(AthenaBlock.tools.access).toContain('athena_start_query')
    expect(AthenaBlock.tools.access).toContain('athena_get_query_results')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AthenaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AthenaBlock.name).toBeTruthy()
    expect(AthenaBlock.description).toBeTruthy()
  })
})
