/**
 * Multiavatar utility — generates deterministic SVG avatars locally
 * using the @multiavatar/multiavatar npm package.
 *
 * Avatars are rendered as inline SVG data URIs — no external API calls needed.
 */

import multiavatar from '@multiavatar/multiavatar/esm'

/**
 * Generate raw SVG markup for a given seed.
 */
export function getMultiavatarSvg(seed: string): string {
  return multiavatar(seed)
}

/**
 * Generate an SVG data URI for use as an `<img src>` attribute.
 * The result is a self-contained data URI — no network request required.
 */
export function getMultiavatarDataUri(seed: string): string {
  const svgCode = multiavatar(seed)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`
}

/**
 * Generate a set of avatar data URIs for the user to pick from.
 * The first option is the user's deterministic default; the rest are random variations.
 */
export function generateAvatarOptions(baseSeed: string, count = 8): string[] {
  const options: string[] = [getMultiavatarDataUri(baseSeed)]

  for (let i = 1; i < count; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    options.push(getMultiavatarDataUri(`${baseSeed}-${randomSuffix}`))
  }

  return options
}

/**
 * Check if an image value is a Multiavatar image (data URI or legacy API URL).
 */
export function isMultiavatarUrl(url: string): boolean {
  return url.startsWith('data:image/svg+xml;') || url.startsWith('https://api.multiavatar.com/')
}

/**
 * Get a default avatar data URI for a user based on their identifier.
 * Falls back to 'default-user' if no identifier is provided.
 */
export function getDefaultAvatarUrl(nameOrEmail?: string | null): string {
  return getMultiavatarDataUri(nameOrEmail || 'default-user')
}
