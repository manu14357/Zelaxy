import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { credentialMember, user } from '@/db/schema'
import { getCredentialAccess, permissionAtLeast } from '../../utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('CredentialSetMembersAPI')

const ShareSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  permission: z.enum(['read', 'write', 'admin']).default('read'),
})

// GET /api/credential-sets/[id]/members — list who a credential is shared with.
// Requires admin access on the credential.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getCredentialAccess(id, session.user.id)
    if (!access.found) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }
    if (!permissionAtLeast(access.permission, 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const members = await db
      .select({
        id: credentialMember.id,
        userId: credentialMember.userId,
        permission: credentialMember.permission,
        email: user.email,
        name: user.name,
        createdAt: credentialMember.createdAt,
      })
      .from(credentialMember)
      .leftJoin(user, eq(user.id, credentialMember.userId))
      .where(eq(credentialMember.credentialId, id))

    return NextResponse.json({ members, total: members.length })
  } catch (error) {
    logger.error(`[${requestId}] Error listing credential members:`, error)
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 })
  }
}

// POST /api/credential-sets/[id]/members — share the credential with a user (or
// update their grant). Requires admin access on the credential.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await getCredentialAccess(id, session.user.id)
    if (!access.found) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }
    if (!permissionAtLeast(access.permission, 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = ShareSchema.parse(await req.json())

    const now = new Date()
    await db
      .insert(credentialMember)
      .values({
        id: crypto.randomUUID(),
        credentialId: id,
        userId: data.userId,
        permission: data.permission,
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [credentialMember.credentialId, credentialMember.userId],
        set: { permission: data.permission, updatedAt: now },
      })

    logger.info(
      `[${requestId}] Credential ${id} shared with ${data.userId} (${data.permission}) by ${session.user.id}`
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    logger.error(`[${requestId}] Error sharing credential:`, error)
    return NextResponse.json({ error: 'Failed to share credential' }, { status: 500 })
  }
}

// DELETE /api/credential-sets/[id]/members?userId=... — revoke a user's grant.
// Requires admin access on the credential.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')
    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const access = await getCredentialAccess(id, session.user.id)
    if (!access.found) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }
    if (!permissionAtLeast(access.permission, 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await db
      .delete(credentialMember)
      .where(
        and(
          eq(credentialMember.credentialId, id),
          eq(credentialMember.userId, targetUserId)
        )
      )

    logger.info(`[${requestId}] Credential ${id} revoked from ${targetUserId} by ${session.user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`[${requestId}] Error revoking credential access:`, error)
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }
}
