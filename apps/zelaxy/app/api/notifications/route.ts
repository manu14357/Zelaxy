import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'

export const dynamic = 'force-dynamic'

const logger = createLogger('NotificationsAPI')

// In-app notifications placeholder — full notification table to be added in future schema migration

export async function GET(_request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // No notifications table yet — return empty list
    logger.debug(`[${requestId}] Returning empty notifications for user ${session.user.id}`)

    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      total: 0,
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching notifications:`, error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (!markAllRead && (!Array.isArray(notificationIds) || notificationIds.length === 0)) {
      return NextResponse.json(
        { error: 'Provide notificationIds or markAllRead: true' },
        { status: 400 }
      )
    }

    // No-op until notifications table is added
    logger.debug(`[${requestId}] Mark-read noop for user ${session.user.id}`)

    return NextResponse.json({ success: true, updated: 0 })
  } catch (error) {
    logger.error(`[${requestId}] Error marking notifications read:`, error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
