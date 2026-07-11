/**
 * Config tests for the Google Ads block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GoogleAdsBlock } from '@/blocks/blocks/google_ads'

describe('Google Ads Block Config', () => {
  it('has the correct block type', () => {
    expect(GoogleAdsBlock.type).toBe('google_ads')
  })

  it("is in the 'tools' category", () => {
    expect(GoogleAdsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GoogleAdsBlock.tools.access.length).toBeGreaterThan(0)
    expect(GoogleAdsBlock.tools.access).toContain('google_ads_search')
    expect(GoogleAdsBlock.tools.access).toContain('google_ads_list_campaigns')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GoogleAdsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GoogleAdsBlock.name).toBeTruthy()
    expect(GoogleAdsBlock.description).toBeTruthy()
  })
})
