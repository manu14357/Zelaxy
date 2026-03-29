import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { extractRequestContext, recordAuditLog } from '@/lib/audit/service'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { member, permissions, workspace } from '@/db/schema'

const logger = createLogger('WorkspaceTransferAPI')

export const dynamic = 'force-dynamic'

/**
 * POST /api/workspaces/[id]/transfer
 * Transfer workspace ownership to another user.
 * Only the workspace owner or an organization admin can do this.
 *
 * Body: { newOwnerId: string }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const { newOwnerId } = await request.json()

    if (!newOwnerId || typeof newOwnerId !== 'string') {
      return NextResponse.json({ error: 'newOwnerId is required' }, { status: 400 })
    }

    if (newOwnerId === session.user.id) {
      return NextResponse.json({ error: 'Cannot transfer workspace to yourself' }, { status: 400 })
    }

    // Get the workspace
    const workspaceEntry = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1)

    if (workspaceEntry.length === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const ws = workspaceEntry[0]
    const isOwner = ws.ownerId === session.user.id

    // Check if user is org admin (if workspace belongs to an org)
    let isOrgAdmin = false
    if (ws.organizationId) {
      const memberEntry = await db
        .select()
        .from(member)
        .where(
          and(eq(member.organizationId, ws.organizationId), eq(member.userId, session.user.id))
        )
        .limit(1)

      if (memberEntry.length > 0 && ['owner', 'admin'].includes(memberEntry[0].role)) {
        isOrgAdmin = true
      }
    }

    if (!isOwner && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only workspace owner or organization admin can transfer ownership' },
        { status: 403 }
      )
    }

    // Verify the new owner has access to the workspace (must have permissions)
    const newOwnerPermission = await getUserEntityPermissions(newOwnerId, 'workspace', workspaceId)

    if (!newOwnerPermission) {
      return NextResponse.json(
        {
          error: 'The new owner must be a member of this workspace. Invite them first.',
        },
        { status: 400 }
      )
    }

    const previousOwnerId = ws.ownerId

    // Transfer ownership
    await db
      .update(workspace)
      .set({
        ownerId: newOwnerId,
        updatedAt: new Date(),
      })
      .where(eq(workspace.id, workspaceId))

    // Ensure the new owner has admin permissions
    const existingPermission = await getUserEntityPermissions(newOwnerId, 'workspace', workspaceId)
    if (existingPermission !== 'admin') {
      await db
        .update(permissions)
        .set({ permissionType: 'admin', updatedAt: new Date() })
        .where(
          and(
            eq(permissions.userId, newOwnerId),
            eq(permissions.entityType, 'workspace'),
            eq(permissions.entityId, workspaceId)
          )
        )
    }

    logger.info('Workspace ownership transferred', {
      workspaceId,
      previousOwnerId,
      newOwnerId,
      transferredBy: session.user.id,
    })

    // Audit log
    const { ipAddress, userAgent } = extractRequestContext(request)
    recordAuditLog({
      userId: session.user.id,
      organizationId: ws.organizationId,
      action: 'workspace.transferred',
      entityType: 'workspace',
      entityId: workspaceId,
      metadata: {
        workspaceName: ws.name,
        previousOwnerId,
        newOwnerId,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Workspace ownership transferred successfully',
      data: {
        workspaceId,
        previousOwnerId,
        newOwnerId,
        transferredBy: session.user.id,
        transferredAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Failed to transfer workspace ownership', {
      workspaceId: (await params).id,
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
