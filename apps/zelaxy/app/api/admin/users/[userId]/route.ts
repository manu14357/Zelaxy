import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin/utils'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import * as schema from '@/db/schema'

// GET /api/admin/users/[userId] — Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { isAdmin } = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 })
  }

  const { userId } = await params

  try {
    const users = await db.select().from(schema.user).where(eq(schema.user.id, userId))

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: users[0] })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[userId] — Delete a user (cascades sessions, accounts, etc.)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { isAdmin, session } = await isCurrentUserAdmin()
  if (!isAdmin || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 })
  }

  const { userId } = await params

  // Prevent self-deletion
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  try {
    const users = await db.select().from(schema.user).where(eq(schema.user.id, userId))

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 1. Delete marketplace entries (was NO ACTION FK, now CASCADE but clean up explicitly for safety)
    await db.delete(schema.marketplace).where(eq(schema.marketplace.authorId, userId))

    // 2. Revoke all sessions for this user via better-auth
    try {
      const userSessions = await db
        .select()
        .from(schema.session)
        .where(eq(schema.session.userId, userId))

      for (const s of userSessions) {
        try {
          await auth.api.revokeSession({ body: { token: s.token }, headers: new Headers() })
        } catch {
          // Session may already be expired/invalid, continue
        }
      }
    } catch {
      // If session revocation fails, the cascade delete will still remove them
    }

    // 3. Delete all sessions explicitly (in case revoke didn't remove from DB)
    await db.delete(schema.session).where(eq(schema.session.userId, userId))

    // 4. Delete user (remaining FKs cascade automatically)
    await db.delete(schema.user).where(eq(schema.user.id, userId))

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
