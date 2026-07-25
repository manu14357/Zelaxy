import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { acceptOrgInvitation } from '@/lib/invitations/accept-org-invitation'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { invitation } from '@/db/schema'

const logger = createLogger('AutoAcceptInvitations')

export const dynamic = 'force-dynamic'

/**
 * POST /api/organizations/invitations/auto-accept
 *
 * Automatically accepts all pending organization (and linked workspace) invitations for the
 * currently authenticated user's email. Called after login / email-verification / first arena
 * load so the user doesn't have to manually click "Accept" on every invite.
 *
 * Delegates to lib/invitations/accept-org-invitation.ts, the shared helper also used by
 * POST /api/invitations/[id] and GET /api/organizations/invitations/accept — this keeps
 * status/expiry/email-match/seat-cap validation and the workspace-invitation cascade
 * consistent across all three. A failure on any single invitation (e.g. it expired, or the
 * organization is now over its seat cap) is skipped rather than aborting the whole batch.
 */
export async function POST() {
  const session = await getSession()

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all pending org invitations for this email
    const pendingInvitations = await db
      .select({ id: invitation.id })
      .from(invitation)
      .where(and(eq(invitation.email, session.user.email), eq(invitation.status, 'pending')))

    const accepted: string[] = []

    for (const pending of pendingInvitations) {
      const result = await acceptOrgInvitation({
        invitationId: pending.id,
        userId: session.user.id,
        userEmail: session.user.email,
      })

      if (result.success) {
        accepted.push(pending.id)
        logger.info('Auto-accepted organization invitation', {
          invitationId: pending.id,
          organizationId: result.organizationId,
          userId: session.user.id,
        })
      } else {
        logger.debug('Skipped invitation during auto-accept', {
          invitationId: pending.id,
          userId: session.user.id,
          reason: result.reason,
        })
      }
    }

    return NextResponse.json({
      success: true,
      accepted: accepted.length,
      invitationIds: accepted,
    })
  } catch (error) {
    logger.error('Failed to auto-accept invitations', {
      userId: session.user.id,
      error,
    })
    return NextResponse.json({ error: 'Failed to auto-accept invitations' }, { status: 500 })
  }
}
