import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { notification } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('NotificationsAPI')

/**
 * GET /api/notifications - the current user's in-app notifications (newest
 * first, capped) plus the unread count. Backed by the `notification` table,
 * written by the usage-threshold alerts (lib/billing/usage-alerts.ts).
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50)

    const scope = eq(notification.userId, session.user.id)
    const where = unreadOnly ? and(scope, eq(notification.read, false)) : scope

    const rows = await db
      .select()
      .from(notification)
      .where(where)
      .orderBy(desc(notification.createdAt))
      .limit(limit)

    const [{ value: unreadCount }] = await db
      .select({ value: count() })
      .from(notification)
      .where(and(scope, eq(notification.read, false)))

    return NextResponse.json({
      notifications: rows,
      unreadCount,
      total: rows.length,
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching notifications:`, error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

/**
 * PATCH /api/notifications - mark notifications read, by id list or all.
 * Body: { notificationIds?: string[], markAllRead?: boolean }.
 */
export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { notificationIds, markAllRead } = body as {
      notificationIds?: string[]
      markAllRead?: boolean
    }

    if (!markAllRead && (!Array.isArray(notificationIds) || notificationIds.length === 0)) {
      return NextResponse.json(
        { error: 'Provide notificationIds or markAllRead: true' },
        { status: 400 }
      )
    }

    // Always scope the update to the caller's own rows - never trust the ids
    // to belong to this user.
    const scope = eq(notification.userId, session.user.id)
    const where = markAllRead
      ? and(scope, eq(notification.read, false))
      : and(scope, inArray(notification.id, notificationIds as string[]))

    await db.update(notification).set({ read: true }).where(where)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`[${requestId}] Error marking notifications read:`, error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
