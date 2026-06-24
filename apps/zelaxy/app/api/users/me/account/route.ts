import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { user } from '@/db/schema'

const logger = createLogger('DeleteAccountAPI')

/**
 * DELETE /api/users/me/account — permanently deletes the signed-in user's OWN account. Gated by an
 * email re-type confirmation. Deleting the `user` row cascades to all owned data (settings,
 * workflows, sessions, accounts, …) via the schema's onDelete: 'cascade' foreign keys. The client
 * signs out afterward. Powers the Privacy → "Delete Account" button.
 */
export async function DELETE(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const sessionEmail = String(session.user.email ?? '')

    const body = await request.json().catch(() => ({}) as Record<string, unknown>)
    const confirmEmail = String((body as Record<string, unknown>)?.confirmEmail ?? '')
      .trim()
      .toLowerCase()

    // Require the user to re-type their exact email as a deliberate confirmation guard.
    if (!confirmEmail || confirmEmail !== sessionEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email confirmation does not match your account.' },
        { status: 400 }
      )
    }

    await db.delete(user).where(eq(user.id, userId))

    logger.info(`[${requestId}] Account permanently deleted`, { userId })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    logger.error(`[${requestId}] Account deletion failed`, error)
    return NextResponse.json({ error: 'Account deletion failed' }, { status: 500 })
  }
}
