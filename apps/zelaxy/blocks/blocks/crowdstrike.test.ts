/**
 * Config tests for the CrowdStrike block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CrowdStrikeBlock } from '@/blocks/blocks/crowdstrike'

describe('CrowdStrike Block Config', () => {
  it('has the correct block type', () => {
    expect(CrowdStrikeBlock.type).toBe('crowdstrike')
  })

  it("is in the 'tools' category", () => {
    expect(CrowdStrikeBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CrowdStrikeBlock.tools.access.length).toBeGreaterThan(0)
    expect(CrowdStrikeBlock.tools.access).toContain('crowdstrike_query_sensors')
    expect(CrowdStrikeBlock.tools.access).toContain('crowdstrike_get_sensor_details')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CrowdStrikeBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CrowdStrikeBlock.name).toBeTruthy()
    expect(CrowdStrikeBlock.description).toBeTruthy()
  })
})
