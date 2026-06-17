import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { invitation, member, organization, user } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('InvitationsAPI')

const AcceptSchema = z.object({ action: z.enum(['accept', 'decline']) })

// GET /api/invitations/[id] — Get invitation details
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const rows = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        inviterName: user.name,
        inviterEmail: user.email,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(eq(invitation.id, id))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const inv = rows[0]

    if (new Date(inv.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    return NextResponse.json({ invitation: inv })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching invitation ${id}:`, error)
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 })
  }
}

// POST /api/invitations/[id] — Accept or decline an organization invitation
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = AcceptSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Provide action: "accept" or "decline"' }, { status: 400 })
    }

    const { action } = validation.data

    const rows = await db
      .select()
      .from(invitation)
      .where(and(eq(invitation.id, id), eq(invitation.status, 'pending')))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found or already processed' },
        { status: 404 }
      )
    }

    const inv = rows[0]

    if (new Date(inv.expiresAt) < new Date()) {
      await db.update(invitation).set({ status: 'expired' }).where(eq(invitation.id, id))
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    if (inv.email !== session.user.email) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address' },
        { status: 403 }
      )
    }

    if (action === 'decline') {
      await db.update(invitation).set({ status: 'declined' }).where(eq(invitation.id, id))
      logger.info(`[${requestId}] User ${session.user.id} declined invitation ${id}`)
      return NextResponse.json({ success: true, status: 'declined' })
    }

    // Accept: add user as a member of the organization
    const existingMember = await db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.userId, session.user.id), eq(member.organizationId, inv.organizationId)))
      .limit(1)

    if (existingMember.length === 0) {
      await db.insert(member).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        organizationId: inv.organizationId,
        role: inv.role,
        createdAt: new Date(),
      })
    }

    await db.update(invitation).set({ status: 'accepted' }).where(eq(invitation.id, id))

    logger.info(
      `[${requestId}] User ${session.user.id} accepted invitation ${id} for org ${inv.organizationId}`
    )

    return NextResponse.json({
      success: true,
      status: 'accepted',
      organizationId: inv.organizationId,
    })
  } catch (error) {
    logger.error(`[${requestId}] Error processing invitation ${id}:`, error)
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 })
  }
}
