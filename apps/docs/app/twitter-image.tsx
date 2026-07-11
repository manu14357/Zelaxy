import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/branding/og-image'

export const alt = OG_ALT
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function TwitterImage() {
  return renderOgImage()
}
