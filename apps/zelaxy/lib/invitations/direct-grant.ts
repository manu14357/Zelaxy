import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { getEmailSubject, renderWorkspaceAddedEmail } from '@/components/emails/render-email'
import { sendEmail } from '@/lib/email/mailer'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, permissions, type permissionTypeEnum, user } from '@/db/schema'

const logger = createLogger('DirectGrant')

type PermissionType = (typeof permissionTypeEnum.enumValues)[number]

/**
 * Look up whether `email` already belongs to a member of `organizationId`.
 * Returns the member's userId if so, otherwise null.
 *
 * Used as the gate for the "direct-grant fast path": when an invitee is already trusted
 * (an existing member of the organization that owns the workspace), there's no need to
 * make them click through a token-based invitation to get workspace access.
 */
export async function findExistingOrgMemberByEmail(
  organizationId: string,
  email: string
): Promise<{ userId: string } | null> {
  const rows = await db
    .select({ userId: member.userId })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(eq(member.organizationId, organizationId), eq(user.email, email)))
    .limit(1)

  return rows[0] ?? null
}

export interface GrantedWorkspaceInput {
  workspaceId: string
  workspaceName: string
  permission: PermissionType
}

/**
 * Grant workspace access directly (no invitation, no token, no accept-click) to a user who is
 * already a member of the organization that owns the workspace(s), then send a single
 * notification email listing everything they were given access to.
 *
 * Mirrors sim's `grantWorkspaceAccessDirectly`. Callers are responsible for having already
 * confirmed the user doesn't already hold a permission row for each workspace — this function
 * does not re-check (there is no DB-level uniqueness guard on `permissions` yet; see the
 * tracked follow-up for a partial-unique-index migration).
 */
export async function grantWorkspaceAccessDirectly(params: {
  userId: string
  email: string
  inviterName: string
  workspaces: GrantedWorkspaceInput[]
}): Promise<{ success: boolean }> {
  const { userId, email, inviterName, workspaces } = params

  if (workspaces.length === 0) {
    return { success: true }
  }

  const now = new Date()
  await db.insert(permissions).values(
    workspaces.map((ws) => ({
      id: randomUUID(),
      userId,
      entityType: 'workspace' as const,
      entityId: ws.workspaceId,
      permissionType: ws.permission,
      createdAt: now,
      updatedAt: now,
    }))
  )

  logger.info('Granted workspace access directly (existing org member)', {
    userId,
    email,
    workspaceIds: workspaces.map((ws) => ws.workspaceId),
  })

  try {
    const html = await renderWorkspaceAddedEmail(
      inviterName,
      workspaces.map((ws) => ({ workspaceName: ws.workspaceName, permission: ws.permission }))
    )

    const result = await sendEmail({
      to: email,
      subject: getEmailSubject('workspace-added'),
      html,
      emailType: 'transactional',
    })

    if (!result.success) {
      logger.error('Failed to send direct-grant notification email', {
        email,
        message: result.message,
      })
    }

    return { success: true }
  } catch (error) {
    logger.error('Error sending direct-grant notification email', { email, error })
    // The grant itself already succeeded — email delivery failure shouldn't fail the request.
    return { success: true }
  }
}
