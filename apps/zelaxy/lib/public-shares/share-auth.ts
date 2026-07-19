/**
 * Gate logic for public file shares.
 *
 * Four modes, checked against the request:
 *   - public   → always authorized
 *   - password → a signed cookie proves an earlier correct password submission
 *   - email    → a signed cookie proves an earlier email OTP verification
 *   - sso      → an active platform session whose email is allow-listed (or any session when
 *                no allow-list is configured)
 *
 * A short-lived HttpOnly cookie (`file_share_auth_<shareId>`) records a passed gate so repeat
 * requests (e.g. the content stream) don't re-challenge. This mirrors the chat auth cookie
 * pattern (app/api/chat/utils) but is self-contained and scoped to a single share id.
 */

import type { NextRequest, NextResponse } from 'next/server'
import { isDev } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import {
  isShareExpired,
  type PublicShareRow,
  verifySharePassword,
} from '@/lib/public-shares/share-manager'

const logger = createLogger('PublicShareAuth')

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

export function shareAuthCookieName(shareId: string): string {
  return `file_share_auth_${shareId}`
}

/** Opaque cookie token: base64(shareId:mode:issuedAt). Validated against the share id + TTL. */
export function encodeShareAuthToken(shareId: string, mode: string): string {
  return Buffer.from(`${shareId}:${mode}:${Date.now()}`).toString('base64')
}

export function validateShareAuthToken(token: string, shareId: string): boolean {
  try {
    const [storedId, _mode, issuedAt] = Buffer.from(token, 'base64').toString().split(':')
    if (storedId !== shareId) return false
    const createdAt = Number.parseInt(issuedAt, 10)
    if (!Number.isFinite(createdAt)) return false
    return Date.now() - createdAt <= COOKIE_MAX_AGE_SECONDS * 1000
  } catch {
    return false
  }
}

/** Attach the passed-gate cookie to a response. */
export function setShareAuthCookie(response: NextResponse, share: PublicShareRow): void {
  response.cookies.set({
    name: shareAuthCookieName(share.id),
    value: encodeShareAuthToken(share.id, share.mode),
    httpOnly: true,
    secure: !isDev,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
}

/** True when the request already carries a valid passed-gate cookie for this share. */
export function hasValidShareCookie(request: NextRequest, share: PublicShareRow): boolean {
  const cookie = request.cookies.get(shareAuthCookieName(share.id))
  return !!cookie && validateShareAuthToken(cookie.value, share.id)
}

/**
 * Is `email` permitted by an allow-list? Supports exact addresses and "@domain" entries.
 * An empty/absent list means "no explicit allow-list" (callers decide what that implies).
 */
export function isEmailAllowed(email: string, allowedEmails: string[] | null | undefined): boolean {
  if (!allowedEmails || allowedEmails.length === 0) return false
  const normalized = email.trim().toLowerCase()
  const domain = normalized.split('@')[1]
  return allowedEmails.some((allowed) => {
    const a = allowed.trim().toLowerCase()
    if (a.startsWith('@')) return !!domain && a === `@${domain}`
    return a === normalized
  })
}

export interface ShareGateResult {
  authorized: boolean
  /**
   * Machine-readable reason when not authorized:
   *   expired | not_found | auth_required_password | auth_required_email | auth_required_sso
   */
  error?: string
}

/**
 * Decide whether a request may access a share, WITHOUT consuming a password/email/OTP body —
 * this is the cookie-and-mode check used by GET (metadata) and the content stream. Interactive
 * challenges (submitting a password, requesting/verifying an OTP, completing SSO) are handled by
 * the dedicated route handlers, which call setShareAuthCookie on success.
 */
export function evaluateShareGate(
  request: NextRequest,
  share: PublicShareRow | null
): ShareGateResult {
  if (!share) return { authorized: false, error: 'not_found' }

  if (isShareExpired(share)) {
    return { authorized: false, error: 'expired' }
  }

  if (share.mode === 'public') {
    return { authorized: true }
  }

  if (hasValidShareCookie(request, share)) {
    return { authorized: true }
  }

  return { authorized: false, error: `auth_required_${share.mode}` }
}

/**
 * Verify a submitted password for a password-gated share. Returns true when it matches; the
 * caller is responsible for setting the cookie on success.
 */
export async function verifySharePasswordSubmission(
  share: PublicShareRow,
  password: string
): Promise<boolean> {
  if (share.mode !== 'password') return false
  if (!share.passwordHash) {
    logger.error(`Password-gated share ${share.id} has no stored password hash`)
    return false
  }
  return verifySharePassword(password, share.passwordHash)
}
