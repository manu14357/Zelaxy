import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { isEmailAllowed, setShareAuthCookie } from '@/lib/public-shares/share-auth'
import { getShareByToken, isShareExpired } from '@/lib/public-shares/share-manager'

const logger = createLogger('PublicShareSsoAPI')

export const dynamic = 'force-dynamic'

/**
 * POST /api/files/public/[token]/sso
 *
 * Satisfies the SSO gate: the visitor must have an active platform session. When the share
 * carries an email allow-list, the session's email must match it; an empty allow-list means any
 * authenticated user is accepted. On success sets the passed-gate cookie.
 *
 * The visitor logs in via the normal platform flow first; this endpoint only converts that
 * session into a share-scoped grant.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const share = await getShareByToken(token)
  if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  if (isShareExpired(share)) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }
  if (share.mode !== 'sso') {
    return NextResponse.json(
      { error: 'This share does not use SSO authentication' },
      { status: 400 }
    )
  }

  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Sign in required', authRequired: 'auth_required_sso' },
      { status: 401 }
    )
  }

  // An allow-list, when present, restricts which signed-in users may view the file.
  const hasAllowList = !!share.allowedEmails && share.allowedEmails.length > 0
  if (hasAllowList) {
    const email = session.user.email
    if (!email || !isEmailAllowed(email, share.allowedEmails)) {
      logger.warn(`SSO share ${share.id}: session email not allow-listed`)
      return NextResponse.json(
        { error: 'Your account is not authorized for this file' },
        {
          status: 403,
        }
      )
    }
  }

  const response = NextResponse.json({ authenticated: true })
  setShareAuthCookie(response, share)
  return response
}
