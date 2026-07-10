/**
 * Config tests for the Cloudflare block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CloudflareBlock } from '@/blocks/blocks/cloudflare'

describe('Cloudflare Block Config', () => {
  it('has the correct block type', () => {
    expect(CloudflareBlock.type).toBe('cloudflare')
  })

  it("is in the 'tools' category", () => {
    expect(CloudflareBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CloudflareBlock.tools.access.length).toBeGreaterThan(0)
    expect(CloudflareBlock.tools.access).toContain('cloudflare_list_zones')
    expect(CloudflareBlock.tools.access).toContain('cloudflare_create_dns_record')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CloudflareBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CloudflareBlock.name).toBeTruthy()
    expect(CloudflareBlock.description).toBeTruthy()
  })
})
