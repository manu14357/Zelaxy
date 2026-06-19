/**
 * MCP domain allowlisting.
 *
 * Self-hosted deployments can restrict which MCP server domains may be added by setting
 * ALLOWED_MCP_DOMAINS (comma-separated). When unset, all domains are allowed. A host matches an
 * allowlist entry if it equals it or is a subdomain of it (e.g. "api.example.com" matches
 * "example.com"). Only URL-based transports (sse/http) are gated — stdio has no remote host.
 */

import { env } from '@/lib/env'

export function getAllowedMcpDomains(): string[] {
  const raw = env.ALLOWED_MCP_DOMAINS
  if (!raw || !raw.trim()) return []
  return raw
    .split(',')
    .map((d) =>
      d
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
    )
    .filter(Boolean)
}

/** True if a host is permitted under the (possibly empty) allowlist. Empty allowlist = allow all. */
export function isHostAllowed(host: string, allowed: string[] = getAllowedMcpDomains()): boolean {
  if (allowed.length === 0) return true
  const h = host.trim().toLowerCase()
  return allowed.some((domain) => h === domain || h.endsWith(`.${domain}`))
}

/** True if a URL's host is permitted. Malformed URLs are rejected when an allowlist is set. */
export function isMcpUrlAllowed(url: string, allowed: string[] = getAllowedMcpDomains()): boolean {
  if (allowed.length === 0) return true
  try {
    return isHostAllowed(new URL(url).hostname, allowed)
  } catch {
    return false
  }
}

/**
 * Validate an MCP server config against the allowlist. Returns an error string if a URL-based
 * transport points at a disallowed domain, otherwise null.
 */
export function checkMcpConfigAllowed(type: string, config: any): string | null {
  const allowed = getAllowedMcpDomains()
  if (allowed.length === 0) return null

  const url: string | undefined =
    type === 'sse'
      ? config?.sse?.endpoint
      : type === 'http' || type === 'streamable-http'
        ? config?.http?.baseUrl
        : undefined

  if (!url) return null // stdio or no URL — nothing to gate
  if (!isMcpUrlAllowed(url, allowed)) {
    return `MCP server domain is not allowed. Permitted domains: ${allowed.join(', ')}`
  }
  return null
}
