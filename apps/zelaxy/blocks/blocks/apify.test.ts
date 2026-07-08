/**
 * Config tests for the Apify block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ApifyBlock } from '@/blocks/blocks/apify'

describe('Apify Block Config', () => {
  it('has the correct block type', () => {
    expect(ApifyBlock.type).toBe('apify')
  })

  it("is in the 'tools' category", () => {
    expect(ApifyBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ApifyBlock.tools.access.length).toBeGreaterThan(0)
    expect(ApifyBlock.tools.access).toContain('apify_run_actor_sync')
    expect(ApifyBlock.tools.access).toContain('apify_get_dataset')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ApifyBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ApifyBlock.name).toBeTruthy()
    expect(ApifyBlock.description).toBeTruthy()
  })
})
