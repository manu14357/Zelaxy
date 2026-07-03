/**
 * Normalize an organization email domain for SSO routing.
 *
 * Accepts loose input (a bare domain, an email address, a URL, a wildcard host) and returns a
 * lowercased registrable domain like `company.com`, or `null` if it cannot be normalized to a
 * plausible domain. The normalized value is what gets stored on the SSO provider record and
 * matched against the domain portion of a user's email at sign-in.
 */
export function normalizeSSODomain(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null

  let value = input.trim().toLowerCase()
  if (!value) return null

  // Strip a protocol/scheme if a URL was pasted in.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')

  // If an email address was entered, keep only the domain portion.
  if (value.includes('@')) {
    value = value.slice(value.lastIndexOf('@') + 1)
  }

  // Drop any path, query or fragment.
  value = value.split('/')[0].split('?')[0].split('#')[0]

  // Drop a port suffix.
  value = value.split(':')[0]

  // Drop a leading wildcard (e.g. *.company.com) and any leading dots.
  value = value.replace(/^\*\./, '').replace(/^\.+/, '')

  // Drop a trailing dot (fully-qualified domain form).
  value = value.replace(/\.+$/, '')

  if (!value) return null

  // Must look like a registrable domain: at least one dot, valid labels, valid TLD.
  const domainPattern = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
  if (!domainPattern.test(value)) return null

  return value
}
