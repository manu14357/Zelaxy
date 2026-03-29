import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { invitation, member, permissions, workspaceInvitation } from '@/db/schema'

const logger = createLogger('AutoAcceptInvitations')

export const dynamic = 'force-dynamic'

/**
 * POST /api/organizations/invitations/auto-accept
 *
 * Automatically accepts all pending organization (and linked workspace)
 * invitations for the currently authenticated user's email.
 * Called after login / email-verification / first arena load so the
 * user doesn't have to manually click "Accept" on every invite.
 */
export async function POST() {
  const session = await getSession()

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all pending, non-expired org invitations for this email
    const pendingInvitations = await db
      .select()
      .from(invitation)
      .where(and(eq(invitation.email, session.user.email), eq(invitation.status, 'pending')))

    const accepted: string[] = []

    for (const orgInvitation of pendingInvitations) {
      // Skip expired invitations
      if (orgInvitation.expiresAt && new Date() > orgInvitation.expiresAt) {
        continue
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(member)
        .where(
          and(
            eq(member.organizationId, orgInvitation.organizationId),
            eq(member.userId, session.user.id)
          )
        )
        .limit(1)

      if (existingMember.length > 0) {
        // Already a member — just mark invitation as accepted
        await db
          .update(invitation)
          .set({ status: 'accepted' })
          .where(eq(invitation.id, orgInvitation.id))
        continue
      }

      // Accept inside a transaction
      await db.transaction(async (tx) => {
        // Add user as org member
        await tx.insert(member).values({
          id: randomUUID(),
          userId: session.user.id,
          organizationId: orgInvitation.organizationId,
          role: orgInvitation.role,
          createdAt: new Date(),
        })

        // Mark invitation as accepted
        await tx
          .update(invitation)
          .set({ status: 'accepted' })
          .where(eq(invitation.id, orgInvitation.id))

        // Also accept any pending workspace invitations for the same email
        const wsInvitations = await tx
          .select()
          .from(workspaceInvitation)
          .where(
            and(
              eq(workspaceInvitation.email, orgInvitation.email),
              eq(workspaceInvitation.status, 'pending')
            )
          )

        for (const wsInvite of wsInvitations) {
          if (wsInvite.expiresAt && new Date() > wsInvite.expiresAt) continue

          const existingPerm = await tx
            .select()
            .from(permissions)
            .where(
              and(
                eq(permissions.userId, session.user.id),
                eq(permissions.entityType, 'workspace'),
                eq(permissions.entityId, wsInvite.workspaceId)
              )
            )
            .limit(1)

          if (existingPerm.length === 0) {
            await tx.insert(permissions).values({
              id: randomUUID(),
              userId: session.user.id,
              entityType: 'workspace',
              entityId: wsInvite.workspaceId,
              permissionType: wsInvite.permissions,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }

          await tx
            .update(workspaceInvitation)
            .set({ status: 'accepted' })
            .where(eq(workspaceInvitation.id, wsInvite.id))
        }
      })

      accepted.push(orgInvitation.id)

      logger.info('Auto-accepted organization invitation', {
        invitationId: orgInvitation.id,
        organizationId: orgInvitation.organizationId,
        userId: session.user.id,
      })
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
