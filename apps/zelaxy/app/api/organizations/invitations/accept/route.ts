import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'
import {
  type AcceptOrgInvitationFailureReason,
  acceptOrgInvitation,
} from '@/lib/invitations/accept-org-invitation'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('OrganizationInvitationAcceptanceAPI')

export const dynamic = 'force-dynamic'

const AcceptInvitationBodySchema = z.object({
  invitationId: z.string().min(1, 'Missing invitationId'),
})

// Maps the shared helper's failure reasons onto the `/invite/invite-error?reason=...` page's
// known reason codes (see app/invite/invite-error/invite-error.tsx).
const REDIRECT_REASON_BY_FAILURE: Record<AcceptOrgInvitationFailureReason, string> = {
  'not-found': 'invalid-invitation',
  'already-processed': 'already-processed',
  expired: 'expired',
  'email-mismatch': 'email-mismatch',
  'seat-cap': 'seat-cap',
  'server-error': 'server-error',
}

/**
 * GET /api/organizations/invitations/accept?id=...
 *
 * This is a real browser-navigation entry point — invitation emails link straight to this
 * URL — so it stays redirect-based (unlike the workspace-tier accept route, which is only
 * ever called via `fetch()` from app/invite/[id]/invite.tsx and was rewritten to return JSON
 * for that reason; see app/api/arenas/invitations/accept/route.ts).
 *
 * Validation/accept logic itself is delegated to lib/invitations/accept-org-invitation.ts, the
 * shared helper also used by POST /api/invitations/[id] and
 * POST /api/organizations/invitations/auto-accept.
 *
 * Behavior note: previously this route treated "the invitee is already an org member" as a
 * hard error (redirect to invite-error?reason=already-member) even though the invitation was
 * still legitimately pending — that was inconsistent with the auto-accept endpoint, which
 * silently marks it accepted instead. The shared helper's behavior (silently mark accepted,
 * no error) is now used everywhere, which changes this specific redirect target from an error
 * page to the success page in that case. See the consolidation notes in
 * lib/invitations/accept-org-invitation.ts.
 */
export async function GET(req: NextRequest) {
  const invitationId = req.nextUrl.searchParams.get('id')
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/'

  if (!invitationId) {
    return NextResponse.redirect(
      new URL('/invite/invite-error?reason=missing-invitation-id', baseUrl)
    )
  }

  const session = await getSession()

  if (!session?.user?.id) {
    // Redirect to login/signup; the user will be sent back here after authenticating.
    return NextResponse.redirect(new URL(`/invite/organization?id=${invitationId}`, baseUrl))
  }

  const result = await acceptOrgInvitation({
    invitationId,
    userId: session.user.id,
    userEmail: session.user.email,
  })

  if (!result.success) {
    logger.warn('Failed to accept organization invitation via redirect flow', {
      invitationId,
      userId: session.user.id,
      reason: result.reason,
    })
    return NextResponse.redirect(
      new URL(`/invite/invite-error?reason=${REDIRECT_REASON_BY_FAILURE[result.reason]}`, baseUrl)
    )
  }

  logger.info('Successfully accepted organization invitation via redirect flow', {
    organizationId: result.organizationId,
    userId: session.user.id,
    alreadyMember: result.alreadyMember,
    workspacesJoined: result.workspacesJoined,
  })

  return NextResponse.redirect(new URL('/workspaces?invite=accepted', baseUrl))
}

// POST endpoint for programmatic acceptance (for API use). No internal callers today, but kept
// for API-compatibility with anything external hitting it directly.
export async function POST(req: NextRequest) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parseResult = AcceptInvitationBodySchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const { invitationId } = parseResult.data

    const result = await acceptOrgInvitation({
      invitationId,
      userId: session.user.id,
      userEmail: session.user.email,
    })

    if (!result.success) {
      const statusByReason: Record<AcceptOrgInvitationFailureReason, number> = {
        'not-found': 404,
        'already-processed': 400,
        expired: 400,
        'email-mismatch': 403,
        'seat-cap': 400,
        'server-error': 500,
      }
      return NextResponse.json({ error: result.message }, { status: statusByReason[result.reason] })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined organization and ${result.workspacesJoined} workspace(s)`,
      organizationId: result.organizationId,
      workspacesJoined: result.workspacesJoined,
    })
  } catch (error) {
    logger.error('Failed to accept organization invitation via API', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
