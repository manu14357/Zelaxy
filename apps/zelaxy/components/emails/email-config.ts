import { getBrandConfig } from '@/lib/branding/branding'
import { env } from '@/lib/env'

const PRODUCTION_BASE_URL = 'https://zelaxy.in'

/**
 * Public, absolute base URL for email content. Emails are read OUTSIDE the app
 * (in the recipient's inbox), so relative paths and `localhost` are dead - image
 * `src` and links MUST be absolute and publicly reachable. Resolution order:
 *   1. NEXT_PUBLIC_APP_URL, if it's a real public URL (not localhost).
 *   2. NEXT_PUBLIC_BLOB_BASE_URL (CDN), if set.
 *   3. the production domain.
 * This is why the previous templates showed a broken logo when sent from a
 * local run: getAssetUrl() returned a relative "/Zelaxy.png" and baseUrl fell
 * back to http://localhost:3000, neither of which an inbox can load.
 */
export function getEmailBaseUrl(): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL
  if (appUrl && !/localhost|127\.0\.0\.1|0\.0\.0\.0|\.local\b/i.test(appUrl)) {
    return appUrl.replace(/\/+$/, '')
  }
  const cdn = env.NEXT_PUBLIC_BLOB_BASE_URL
  if (cdn) return cdn.replace(/\/+$/, '')
  return PRODUCTION_BASE_URL
}

/**
 * Absolute, email-safe logo URL - always a hosted PNG (email clients don't
 * render SVG reliably), never a relative path. Honors a configured brand logo
 * or CDN, else serves it from the public base URL.
 */
export function getEmailLogoUrl(): string {
  const brand = getBrandConfig()
  if (brand.logoUrl && /^https?:\/\//i.test(brand.logoUrl)) return brand.logoUrl
  const cdn = env.NEXT_PUBLIC_BLOB_BASE_URL
  if (cdn) return `${cdn.replace(/\/+$/, '')}/Zelaxy.png`
  return `${getEmailBaseUrl()}/Zelaxy.png`
}
