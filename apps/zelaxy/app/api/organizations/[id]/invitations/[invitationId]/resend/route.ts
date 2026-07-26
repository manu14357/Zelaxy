import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getEmailSubject, renderInvitationEmail } from '@/components/emails/render-email'
import { auth, getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email/mailer'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { invitation, member, organization, user } from '@/db/schema'

const logger = createLogger('OrganizationInvitationResendAPI')

export const dynamic = 'force-dynamic'

/**
 * POST /api/organizations/[id]/invitations/[invitationId]/resend
 *
 * Resends a pending organization invitation. better-auth's own `invitation` table has no
 * rotatable token column — the invitation `id` itself is the accept-link identifier — so
 * "resend" here means: cancel the existing invitation via better-auth's own cancel API
 * (`auth.api.cancelInvitation`, the same primitive `stores/organization/store.ts` already
 * uses client-side), then create a fresh invitation via the exact same direct-insert code
 * path `POST /api/organizations/[id]/invitations` already uses, and re-send the email via
 * the existing template. This intentionally reuses what's already there rather than
 * introducing a new way to bypass better-auth's hooks.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  const { id: organizationId, invitationId } = await params

  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the caller is an admin/owner of this organization
    const memberEntry = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)))
      .limit(1)

    if (memberEntry.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden - Not a member of this organization' },
        { status: 403 }
      )
    }

    if (!['owner', 'admin'].includes(memberEntry[0].role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch the invitation and make sure it belongs to this organization
    const existing = await db
      .select()
      .from(invitation)
      .where(and(eq(invitation.id, invitationId), eq(invitation.organizationId, organizationId)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const orgInvitation = existing[0]

    if (orgInvitation.status !== 'pending') {
      return NextResponse.json({ error: 'Can only resend pending invitations' }, { status: 400 })
    }

    // Cancel the existing invitation via better-auth's own primitive
    try {
      await auth.api.cancelInvitation({
        body: { invitationId },
        headers: request.headers,
      })
    } catch (error) {
      logger.error('Failed to cancel invitation before resend', {
        organizationId,
        invitationId,
        error,
      })
      return NextResponse.json(
        { error: 'Failed to cancel the existing invitation' },
        { status: 500 }
      )
    }

    // Create the replacement invitation via the same direct-insert shape the batch/single
    // invite routes already use
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const newInvitationId = randomUUID()
    const newInvitation = {
      id: newInvitationId,
      email: orgInvitation.email,
      inviterId: session.user.id,
      organizationId,
      role: orgInvitation.role,
      status: 'pending' as const,
      expiresAt,
      createdAt: new Date(),
    }

    await db.insert(invitation).values(newInvitation)

    const organizationEntry = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)

    const inviter = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const emailHtml = await renderInvitationEmail(
      inviter[0]?.name || 'Someone',
      organizationEntry[0]?.name || 'organization',
      `${env.NEXT_PUBLIC_APP_URL}/api/organizations/invitations/accept?id=${newInvitationId}`,
      orgInvitation.email
    )

    const emailResult = await sendEmail({
      to: orgInvitation.email,
      subject: getEmailSubject('invitation'),
      html: emailHtml,
      emailType: 'transactional',
    })

    if (!emailResult.success) {
      logger.error('Failed to send resent invitation email', {
        email: orgInvitation.email,
        error: emailResult.message,
      })
    }

    logger.info('Organization invitation resent', {
      organizationId,
      previousInvitationId: invitationId,
      newInvitationId,
      resentBy: session.user.id,
      email: orgInvitation.email,
    })

    return NextResponse.json({
      success: true,
      invitation: newInvitation,
    })
  } catch (error) {
    logger.error('Failed to resend organization invitation', {
      organizationId,
      invitationId,
      error,
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
