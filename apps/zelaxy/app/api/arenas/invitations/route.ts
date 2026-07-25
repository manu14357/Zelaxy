import { randomUUID } from 'crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import {
  findExistingOrgMemberByEmail,
  grantWorkspaceAccessDirectly,
} from '@/lib/invitations/direct-grant'
import { sendWorkspaceInvitationEmail } from '@/lib/invitations/send-workspace-invitation-email'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import {
  permissions,
  type permissionTypeEnum,
  user,
  workspace,
  workspaceInvitation,
} from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('WorkspaceInvitationsAPI')

type PermissionType = (typeof permissionTypeEnum.enumValues)[number]

const CreateWorkspaceInvitationSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  email: z.string().trim().toLowerCase().email('A valid email address is required'),
  role: z.string().max(50).optional().default('member'),
  permission: z.enum(['admin', 'write', 'read']).optional().default('read'),
})

// Get all invitations for the user's workspaces
export async function GET(req: NextRequest) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all workspaces where the user has permissions
    const userWorkspaces = await db
      .select({ id: workspace.id })
      .from(workspace)
      .innerJoin(
        permissions,
        and(
          eq(permissions.entityId, workspace.id),
          eq(permissions.entityType, 'workspace'),
          eq(permissions.userId, session.user.id)
        )
      )

    if (userWorkspaces.length === 0) {
      return NextResponse.json({ invitations: [] })
    }

    // Get all workspaceIds where the user is a member
    const workspaceIds = userWorkspaces.map((w) => w.id)

    // Find all invitations for those workspaces
    const invitations = await db
      .select()
      .from(workspaceInvitation)
      .where(inArray(workspaceInvitation.workspaceId, workspaceIds))

    return NextResponse.json({ invitations })
  } catch (error) {
    logger.error('Error fetching workspace invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

// Create a new invitation
export async function POST(req: NextRequest) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { workspaceId, email, role, permission } = CreateWorkspaceInvitationSchema.parse(body)

    // Check if user has admin permissions for this workspace
    const userPermission = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.entityId, workspaceId),
          eq(permissions.entityType, 'workspace'),
          eq(permissions.userId, session.user.id),
          eq(permissions.permissionType, 'admin')
        )
      )
      .then((rows) => rows[0])

    if (!userPermission) {
      return NextResponse.json(
        { error: 'You need admin permissions to invite users' },
        { status: 403 }
      )
    }

    // Get the workspace details for the email
    const workspaceDetails = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .then((rows) => rows[0])

    if (!workspaceDetails) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if the user is already a member
    // First find if a user with this email exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .then((rows) => rows[0])

    if (existingUser) {
      // Check if the user already has permissions for this workspace
      const existingPermission = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.entityId, workspaceId),
            eq(permissions.entityType, 'workspace'),
            eq(permissions.userId, existingUser.id)
          )
        )
        .then((rows) => rows[0])

      if (existingPermission) {
        return NextResponse.json(
          {
            error: `${email} already has access to this workspace`,
            email,
          },
          { status: 400 }
        )
      }

      // Direct-grant fast path: if the invitee is already a member of the organization that
      // owns this workspace, they're already trusted — skip the token/invitation/accept-click
      // flow entirely and grant workspace access immediately, with just a notification email.
      if (workspaceDetails.organizationId) {
        const existingOrgMember = await findExistingOrgMemberByEmail(
          workspaceDetails.organizationId,
          email
        )

        if (existingOrgMember) {
          await grantWorkspaceAccessDirectly({
            userId: existingOrgMember.userId,
            email,
            inviterName: session.user.name || session.user.email || 'A team member',
            workspaces: [{ workspaceId, workspaceName: workspaceDetails.name, permission }],
          })

          // Clean up any stale pending invitation for this email/workspace so it doesn't
          // linger as a dead token-based invite once access has already been granted.
          await db
            .update(workspaceInvitation)
            .set({ status: 'accepted', updatedAt: new Date() })
            .where(
              and(
                eq(workspaceInvitation.workspaceId, workspaceId),
                eq(workspaceInvitation.email, email),
                eq(workspaceInvitation.status, 'pending')
              )
            )

          return NextResponse.json({
            success: true,
            directGrant: true,
            email,
          })
        }
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db
      .select()
      .from(workspaceInvitation)
      .where(
        and(
          eq(workspaceInvitation.workspaceId, workspaceId),
          eq(workspaceInvitation.email, email),
          eq(workspaceInvitation.status, 'pending')
        )
      )
      .then((rows) => rows[0])

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: `${email} has already been invited to this workspace`,
          email,
        },
        { status: 400 }
      )
    }

    // Generate a unique token and set expiry date (1 week from now)
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create the invitation
    const invitationData = {
      id: randomUUID(),
      workspaceId,
      email,
      inviterId: session.user.id,
      role,
      status: 'pending',
      token,
      permissions: permission,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Create invitation
    await db.insert(workspaceInvitation).values(invitationData)

    // Send the invitation email
    await sendWorkspaceInvitationEmail({
      to: email,
      inviterName: session.user.name || session.user.email || 'A user',
      workspaceName: workspaceDetails.name,
      token: token,
    })

    return NextResponse.json({ success: true, invitation: invitationData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid workspace invitation request body', { errors: error.errors })
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Error creating workspace invitation:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}
