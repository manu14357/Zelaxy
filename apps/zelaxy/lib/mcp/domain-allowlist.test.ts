import { describe, expect, it } from 'vitest'
import { checkMcpConfigAllowed, isHostAllowed, isMcpUrlAllowed } from './domain-allowlist'

describe('isHostAllowed', () => {
  it('allows everything when the allowlist is empty', () => {
    expect(isHostAllowed('anything.com', [])).toBe(true)
  })
  it('matches exact host', () => {
    expect(isHostAllowed('example.com', ['example.com'])).toBe(true)
  })
  it('matches subdomains', () => {
    expect(isHostAllowed('api.example.com', ['example.com'])).toBe(true)
    expect(isHostAllowed('a.b.example.com', ['example.com'])).toBe(true)
  })
  it('rejects non-matching hosts', () => {
    expect(isHostAllowed('evil.com', ['example.com'])).toBe(false)
    expect(isHostAllowed('notexample.com', ['example.com'])).toBe(false)
  })
})

describe('isMcpUrlAllowed', () => {
  it('allows when allowlist empty', () => {
    expect(isMcpUrlAllowed('https://anything.com/mcp', [])).toBe(true)
  })
  it('allows matching url', () => {
    expect(isMcpUrlAllowed('https://api.example.com/mcp', ['example.com'])).toBe(true)
  })
  it('rejects disallowed url', () => {
    expect(isMcpUrlAllowed('https://evil.com/mcp', ['example.com'])).toBe(false)
  })
  it('rejects malformed url when an allowlist is set', () => {
    expect(isMcpUrlAllowed('not a url', ['example.com'])).toBe(false)
  })
})

describe('checkMcpConfigAllowed', () => {
  const allowed = ['example.com']
  it('returns null (allowed) when no allowlist configured', () => {
    // No env set in test → getAllowedMcpDomains() is empty → always allowed.
    expect(checkMcpConfigAllowed('http', { http: { baseUrl: 'https://evil.com' } })).toBeNull()
  })
  it('passes stdio (no url) regardless', () => {
    expect(checkMcpConfigAllowed('stdio', { stdio: { command: 'x' } })).toBeNull()
  })
  it('isMcpUrlAllowed gates http baseUrl against an explicit allowlist', () => {
    expect(isMcpUrlAllowed('https://mcp.example.com', allowed)).toBe(true)
    expect(isMcpUrlAllowed('https://mcp.other.com', allowed)).toBe(false)
  })
})
