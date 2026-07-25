import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { validateSeatAvailability } from '@/lib/billing/validation/seat-management'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { invitation, member, permissions, workspaceInvitation } from '@/db/schema'

const logger = createLogger('AcceptOrgInvitation')

export type AcceptOrgInvitationFailureReason =
  | 'not-found'
  | 'expired'
  | 'already-processed'
  | 'email-mismatch'
  | 'seat-cap'
  | 'server-error'

export interface AcceptOrgInvitationSuccess {
  success: true
  organizationId: string
  role: string
  alreadyMember: boolean
  workspacesJoined: number
}

export interface AcceptOrgInvitationFailure {
  success: false
  reason: AcceptOrgInvitationFailureReason
  message: string
}

export type AcceptOrgInvitationResult = AcceptOrgInvitationSuccess | AcceptOrgInvitationFailure

const FAILURE_MESSAGES: Record<AcceptOrgInvitationFailureReason, string> = {
  'not-found': 'Invitation not found',
  expired: 'This invitation has expired',
  'already-processed': 'This invitation has already been accepted, declined, or cancelled',
  'email-mismatch': 'This invitation was sent to a different email address',
  'seat-cap': "This organization doesn't have any available seats right now",
  'server-error': 'An unexpected error occurred while accepting the invitation',
}

function failure(
  reason: AcceptOrgInvitationFailureReason,
  message?: string
): AcceptOrgInvitationFailure {
  return { success: false, reason, message: message || FAILURE_MESSAGES[reason] }
}

/**
 * Accept any pending workspace invitations that were sent to the same email as the org
 * invitation being accepted (the batch-invite flow creates both together). Skips workspace
 * invitations the user already has a permission row for, and silently skips expired ones
 * rather than failing the whole accept.
 *
 * Runs inside the same transaction as the org-membership insert so the two stay consistent.
 */
async function cascadeAcceptWorkspaceInvitations(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  email: string
): Promise<number> {
  const normalizedEmail = email.toLowerCase()

  const pendingWorkspaceInvitations = await tx
    .select()
    .from(workspaceInvitation)
    .where(eq(workspaceInvitation.status, 'pending'))

  let joined = 0

  for (const wsInvitation of pendingWorkspaceInvitations) {
    if (wsInvitation.email.toLowerCase() !== normalizedEmail) continue

    if (wsInvitation.expiresAt && new Date() > new Date(wsInvitation.expiresAt)) {
      continue
    }

    const existingPermission = await tx
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.userId, userId),
          eq(permissions.entityType, 'workspace'),
          eq(permissions.entityId, wsInvitation.workspaceId)
        )
      )
      .limit(1)

    if (existingPermission.length === 0) {
      await tx.insert(permissions).values({
        id: randomUUID(),
        userId,
        entityType: 'workspace',
        entityId: wsInvitation.workspaceId,
        permissionType: wsInvitation.permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    await tx
      .update(workspaceInvitation)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(workspaceInvitation.id, wsInvitation.id))

    joined++
  }

  return joined
}

/**
 * Single source of truth for accepting a pending organization invitation: token/id lookup,
 * status, expiry, email-match, and seat-cap validation, plus linking any pending workspace
 * invitations sent to the same email (the batch-invite flow). Runs the membership insert +
 * invitation update + workspace-invitation cascade inside one transaction.
 *
 * Consolidates what used to be three independent, drifting implementations:
 * `POST /api/invitations/[id]`, `GET /api/organizations/invitations/accept`, and
 * `POST /api/organizations/invitations/auto-accept`. better-auth's own built-in
 * `client.organization.acceptInvitation()` (used by the org branch of
 * `app/invite/[id]/invite.tsx`) is NOT one of these call sites — it's vendored plugin code we
 * don't own, and by construction it only ever accepts invitations created via
 * `client.organization.inviteMember()`, which never have linked workspace invitations (those
 * are only created by the batch invite route), so there's nothing for it to cascade.
 */
export async function acceptOrgInvitation(params: {
  invitationId: string
  userId: string
  userEmail: string
}): Promise<AcceptOrgInvitationResult> {
  const { invitationId, userId, userEmail } = params

  try {
    const rows = await db.select().from(invitation).where(eq(invitation.id, invitationId)).limit(1)
    const orgInvitation = rows[0]

    if (!orgInvitation) {
      return failure('not-found')
    }

    if (orgInvitation.status !== 'pending') {
      return failure('already-processed')
    }

    if (orgInvitation.expiresAt && new Date() > new Date(orgInvitation.expiresAt)) {
      // Best-effort — don't fail the accept if this update races with something else.
      await db
        .update(invitation)
        .set({ status: 'expired' })
        .where(eq(invitation.id, invitationId))
        .catch((error) => {
          logger.warn('Failed to mark expired invitation as expired', { invitationId, error })
        })
      return failure('expired')
    }

    if (orgInvitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return failure('email-mismatch')
    }

    const existingMember = await db
      .select()
      .from(member)
      .where(
        and(eq(member.organizationId, orgInvitation.organizationId), eq(member.userId, userId))
      )
      .limit(1)

    const alreadyMember = existingMember.length > 0

    if (!alreadyMember) {
      const seatValidation = await validateSeatAvailability(orgInvitation.organizationId, 1)
      if (!seatValidation.canInvite) {
        return failure('seat-cap', seatValidation.reason)
      }
    }

    let workspacesJoined = 0

    await db.transaction(async (tx) => {
      if (!alreadyMember) {
        await tx.insert(member).values({
          id: randomUUID(),
          userId,
          organizationId: orgInvitation.organizationId,
          role: orgInvitation.role,
          createdAt: new Date(),
        })
      }

      await tx.update(invitation).set({ status: 'accepted' }).where(eq(invitation.id, invitationId))

      workspacesJoined = await cascadeAcceptWorkspaceInvitations(tx, userId, orgInvitation.email)
    })

    logger.info('Accepted organization invitation', {
      invitationId,
      organizationId: orgInvitation.organizationId,
      userId,
      alreadyMember,
      workspacesJoined,
    })

    return {
      success: true,
      organizationId: orgInvitation.organizationId,
      role: orgInvitation.role,
      alreadyMember,
      workspacesJoined,
    }
  } catch (error) {
    logger.error('Failed to accept organization invitation', { invitationId, userId, error })
    return failure('server-error')
  }
}
