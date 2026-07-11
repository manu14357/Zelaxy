/**
 * Verifies the social-share image actually renders (Satori accepts the JSX/CSS) and
 * produces a valid 1200x630 PNG.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { OG_SIZE, renderOgImage } from '@/lib/branding/og-image'

describe('social share OG image', () => {
  it('renders a valid PNG', async () => {
    const res = renderOgImage()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')

    const bytes = new Uint8Array(await res.arrayBuffer())
    // PNG magic number: 89 50 4E 47
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47])
    expect(bytes.byteLength).toBeGreaterThan(2000)
  })

  it('is sized 1200x630', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
  })
})
