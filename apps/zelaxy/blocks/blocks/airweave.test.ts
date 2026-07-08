/**
 * Config tests for the Airweave block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AirweaveBlock } from '@/blocks/blocks/airweave'

describe('Airweave Block Config', () => {
  it('has the correct block type', () => {
    expect(AirweaveBlock.type).toBe('airweave')
  })

  it("is in the 'tools' category", () => {
    expect(AirweaveBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AirweaveBlock.tools.access.length).toBeGreaterThan(0)
    expect(AirweaveBlock.tools.access).toContain('airweave_search')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AirweaveBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AirweaveBlock.name).toBeTruthy()
    expect(AirweaveBlock.description).toBeTruthy()
  })
})
