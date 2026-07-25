import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendWorkspaceInvitationEmail } from '@/lib/invitations/send-workspace-invitation-email'
import { hasWorkspaceAdminAccess } from '@/lib/permissions/utils'
import { db } from '@/db'
import { workspace, workspaceInvitation } from '@/db/schema'

export const dynamic = 'force-dynamic'

// POST /api/arenas/invitations/[id] - Resend a workspace invitation (rotates the token,
// resets the 7-day expiry, and re-sends the invitation email).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const invitation = await db
      .select()
      .from(workspaceInvitation)
      .where(eq(workspaceInvitation.id, id))
      .then((rows) => rows[0])

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if current user has admin access to the workspace
    const hasAdminAccess = await hasWorkspaceAdminAccess(session.user.id, invitation.workspaceId)

    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Only pending invitations can be resent
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Can only resend pending invitations' }, { status: 400 })
    }

    const workspaceDetails = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, invitation.workspaceId))
      .then((rows) => rows[0])

    if (!workspaceDetails) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Rotate the token and reset the expiry, matching the create flow's 7-day window
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db
      .update(workspaceInvitation)
      .set({ token, expiresAt, updatedAt: new Date() })
      .where(eq(workspaceInvitation.id, id))

    const emailResult = await sendWorkspaceInvitationEmail({
      to: invitation.email,
      inviterName: session.user.name || session.user.email || 'A user',
      workspaceName: workspaceDetails.name,
      token,
    })

    if (!emailResult.success) {
      console.error('Failed to resend workspace invitation email:', emailResult.message)
    }

    return NextResponse.json({
      success: true,
      invitation: { ...invitation, token, expiresAt },
    })
  } catch (error) {
    console.error('Error resending workspace invitation:', error)
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
  }
}

// DELETE /api/arenas/invitations/[id] - Delete a workspace invitation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get the invitation to delete
    const invitation = await db
      .select({
        id: workspaceInvitation.id,
        workspaceId: workspaceInvitation.workspaceId,
        email: workspaceInvitation.email,
        inviterId: workspaceInvitation.inviterId,
        status: workspaceInvitation.status,
      })
      .from(workspaceInvitation)
      .where(eq(workspaceInvitation.id, id))
      .then((rows) => rows[0])

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if current user has admin access to the workspace
    const hasAdminAccess = await hasWorkspaceAdminAccess(session.user.id, invitation.workspaceId)

    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Only allow deleting pending invitations
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Can only delete pending invitations' }, { status: 400 })
    }

    // Delete the invitation
    await db.delete(workspaceInvitation).where(eq(workspaceInvitation.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace invitation:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}
