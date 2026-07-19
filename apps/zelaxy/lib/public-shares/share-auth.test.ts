/**
 * Unit tests for public-share gate logic (email allow-list, cookie tokens, gate evaluation)
 * and share password hashing. Pure logic — the DB layer is mocked so no connection is needed.
 *
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/db/schema', () => ({ publicShare: {}, workspaceFile: {} }))

import {
  encodeShareAuthToken,
  evaluateShareGate,
  hasValidShareCookie,
  isEmailAllowed,
  shareAuthCookieName,
  validateShareAuthToken,
} from '@/lib/public-shares/share-auth'
import { hashSharePassword, verifySharePassword } from '@/lib/public-shares/share-manager'

type MinimalShare = Parameters<typeof evaluateShareGate>[1]

function makeShare(overrides: Partial<NonNullable<MinimalShare>> = {}): NonNullable<MinimalShare> {
  return {
    id: 'share_1',
    token: 'tok_1',
    workspaceId: 'ws_1',
    fileId: 'file_1',
    mode: 'public',
    passwordHash: null,
    allowedEmails: null,
    expiresAt: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as NonNullable<MinimalShare>
}

function requestWithCookie(name?: string, value?: string) {
  return {
    cookies: {
      get: (n: string) => (name && n === name ? { value: value! } : undefined),
    },
  } as any
}

describe('isEmailAllowed', () => {
  it('matches exact addresses case-insensitively', () => {
    expect(isEmailAllowed('User@Example.com', ['user@example.com'])).toBe(true)
    expect(isEmailAllowed('nope@example.com', ['user@example.com'])).toBe(false)
  })

  it('matches @domain entries', () => {
    expect(isEmailAllowed('anyone@corp.com', ['@corp.com'])).toBe(true)
    expect(isEmailAllowed('anyone@other.com', ['@corp.com'])).toBe(false)
  })

  it('returns false for empty or missing allow-lists', () => {
    expect(isEmailAllowed('a@b.com', [])).toBe(false)
    expect(isEmailAllowed('a@b.com', null)).toBe(false)
    expect(isEmailAllowed('a@b.com', undefined)).toBe(false)
  })
})

describe('share auth cookie tokens', () => {
  it('round-trips a token for the same share id', () => {
    const token = encodeShareAuthToken('share_1', 'password')
    expect(validateShareAuthToken(token, 'share_1')).toBe(true)
  })

  it('rejects a token issued for a different share id', () => {
    const token = encodeShareAuthToken('share_1', 'password')
    expect(validateShareAuthToken(token, 'share_2')).toBe(false)
  })

  it('rejects an expired token', () => {
    const realNow = Date.now
    // Issue the token ~25 hours ago (TTL is 24h).
    const issued = realNow() - 25 * 60 * 60 * 1000
    vi.spyOn(Date, 'now').mockReturnValueOnce(issued)
    const token = encodeShareAuthToken('share_1', 'email')
    vi.restoreAllMocks()
    expect(validateShareAuthToken(token, 'share_1')).toBe(false)
  })

  it('rejects garbage', () => {
    expect(validateShareAuthToken('not-base64-::', 'share_1')).toBe(false)
    expect(validateShareAuthToken('', 'share_1')).toBe(false)
  })

  it('cookie name is namespaced by share id', () => {
    expect(shareAuthCookieName('share_1')).toBe('file_share_auth_share_1')
  })

  it('hasValidShareCookie reads the namespaced cookie', () => {
    const share = makeShare({ mode: 'password' })
    const token = encodeShareAuthToken(share.id, 'password')
    const req = requestWithCookie(shareAuthCookieName(share.id), token)
    expect(hasValidShareCookie(req, share)).toBe(true)
    expect(hasValidShareCookie(requestWithCookie(), share)).toBe(false)
  })
})

describe('evaluateShareGate', () => {
  it('returns not_found for a missing share', () => {
    expect(evaluateShareGate(requestWithCookie(), null)).toEqual({
      authorized: false,
      error: 'not_found',
    })
  })

  it('authorizes public shares without a cookie', () => {
    expect(evaluateShareGate(requestWithCookie(), makeShare({ mode: 'public' }))).toEqual({
      authorized: true,
    })
  })

  it('reports expiry before checking the mode', () => {
    const expired = makeShare({ mode: 'public', expiresAt: new Date(Date.now() - 1000) })
    expect(evaluateShareGate(requestWithCookie(), expired)).toEqual({
      authorized: false,
      error: 'expired',
    })
  })

  it('challenges password/email/sso shares that lack a valid cookie', () => {
    for (const mode of ['password', 'email', 'sso'] as const) {
      expect(evaluateShareGate(requestWithCookie(), makeShare({ mode }))).toEqual({
        authorized: false,
        error: `auth_required_${mode}`,
      })
    }
  })

  it('authorizes a gated share once a valid cookie is present', () => {
    const share = makeShare({ mode: 'password' })
    const token = encodeShareAuthToken(share.id, 'password')
    const req = requestWithCookie(shareAuthCookieName(share.id), token)
    expect(evaluateShareGate(req, share)).toEqual({ authorized: true })
  })
})

describe('share password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const stored = await hashSharePassword('hunter2')
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    expect(await verifySharePassword('hunter2', stored)).toBe(true)
    expect(await verifySharePassword('wrong', stored)).toBe(false)
  })

  it('produces a distinct hash per call (random salt)', async () => {
    const a = await hashSharePassword('same')
    const b = await hashSharePassword('same')
    expect(a).not.toBe(b)
    expect(await verifySharePassword('same', a)).toBe(true)
    expect(await verifySharePassword('same', b)).toBe(true)
  })

  it('returns false for malformed stored values', async () => {
    expect(await verifySharePassword('x', 'garbage')).toBe(false)
    expect(await verifySharePassword('x', '')).toBe(false)
  })
})
