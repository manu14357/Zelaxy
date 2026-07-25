import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { permissions, user, workspace, workspaceInvitation } from '@/db/schema'

export const dynamic = 'force-dynamic'

export type AcceptWorkspaceInvitationReason =
  | 'missing-token'
  | 'unauthenticated'
  | 'invalid-token'
  | 'expired'
  | 'already-processed'
  | 'email-mismatch'
  | 'workspace-not-found'
  | 'server-error'

/**
 * Accept a workspace invitation via token.
 *
 * IMPORTANT: this is a JSON API, not a redirect-based page route. It is called via
 * `fetch()` from `app/invite/[id]/invite.tsx`, which only treats acceptance as
 * successful when the response body has `success: true`. Do NOT change this back to
 * `NextResponse.redirect(...)` — `fetch()` follows redirects transparently, which makes
 * `response.ok` true even on failure and previously caused the client to show "Invitation
 * Accepted" regardless of the real outcome. If a future caller needs a browser-navigable
 * (non-fetch) entry point, add a distinct route for it rather than changing this contract.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { success: false, reason: 'missing-token', error: 'Missing invitation token' },
      { status: 400 }
    )
  }

  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        reason: 'unauthenticated',
        error: 'You must be signed in to accept this invitation',
      },
      { status: 401 }
    )
  }

  try {
    // Find the invitation by token
    const invitation = await db
      .select()
      .from(workspaceInvitation)
      .where(eq(workspaceInvitation.token, token))
      .then((rows) => rows[0])

    if (!invitation) {
      return NextResponse.json(
        { success: false, reason: 'invalid-token', error: 'This invitation link is invalid' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        {
          success: false,
          reason: 'expired',
          error: 'This invitation has expired. Please ask for a new invitation.',
        },
        { status: 410 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          reason: 'already-processed',
          error: 'This invitation has already been accepted or declined.',
        },
        { status: 409 }
      )
    }

    // Get the user's email from the session
    const userEmail = session.user.email.toLowerCase()
    const invitationEmail = invitation.email.toLowerCase()

    // Check if the logged-in user's email matches the invitation
    // We'll use exact matching as the primary check
    const isExactMatch = userEmail === invitationEmail

    // For SSO or company email variants, check domain and normalized username
    // This handles cases like john.doe@company.com vs john@company.com
    const normalizeUsername = (email: string): string => {
      return email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
    }

    const isSameDomain = userEmail.split('@')[1] === invitationEmail.split('@')[1]
    const normalizedUserEmail = normalizeUsername(userEmail)
    const normalizedInvitationEmail = normalizeUsername(invitationEmail)
    const isSimilarUsername =
      normalizedUserEmail === normalizedInvitationEmail ||
      normalizedUserEmail.includes(normalizedInvitationEmail) ||
      normalizedInvitationEmail.includes(normalizedUserEmail)

    const isValidMatch = isExactMatch || (isSameDomain && isSimilarUsername)

    if (!isValidMatch) {
      // Get user info to include in the error message
      const userData = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .then((rows) => rows[0])

      return NextResponse.json(
        {
          success: false,
          reason: 'email-mismatch',
          error: `Invitation was sent to ${invitation.email}, but you're logged in as ${userData?.email || session.user.email}`,
        },
        { status: 403 }
      )
    }

    // Get the workspace details
    const workspaceDetails = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, invitation.workspaceId))
      .then((rows) => rows[0])

    if (!workspaceDetails) {
      return NextResponse.json(
        {
          success: false,
          reason: 'workspace-not-found',
          error: 'The workspace associated with this invitation could not be found.',
        },
        { status: 404 }
      )
    }

    // Check if user already has permissions for this workspace
    const existingPermission = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.entityId, invitation.workspaceId),
          eq(permissions.entityType, 'workspace'),
          eq(permissions.userId, session.user.id)
        )
      )
      .then((rows) => rows[0])

    if (existingPermission) {
      // User already has permissions, just mark the invitation as accepted
      await db
        .update(workspaceInvitation)
        .set({
          status: 'accepted',
          updatedAt: new Date(),
        })
        .where(eq(workspaceInvitation.id, invitation.id))

      return NextResponse.json({
        success: true,
        workspaceId: invitation.workspaceId,
        alreadyMember: true,
      })
    }

    // Add user permissions and mark invitation as accepted in a transaction
    await db.transaction(async (tx) => {
      // Create permissions for the user
      await tx.insert(permissions).values({
        id: randomUUID(),
        entityType: 'workspace' as const,
        entityId: invitation.workspaceId,
        userId: session.user.id,
        permissionType: invitation.permissions || 'read',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Mark invitation as accepted
      await tx
        .update(workspaceInvitation)
        .set({
          status: 'accepted',
          updatedAt: new Date(),
        })
        .where(eq(workspaceInvitation.id, invitation.id))
    })

    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      alreadyMember: false,
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      {
        success: false,
        reason: 'server-error',
        error: 'An unexpected error occurred while processing your invitation.',
      },
      { status: 500 }
    )
  }
}
