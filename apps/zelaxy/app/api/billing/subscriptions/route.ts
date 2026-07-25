import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, subscription } from '@/db/schema'

const logger = createLogger('SubscriptionsAPI')

const QuerySchema = z.object({
  referenceId: z.string().optional(),
})

async function canViewBillingFor(userId: string, referenceId: string): Promise<boolean> {
  if (referenceId === userId) return true

  const members = await db
    .select()
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, referenceId)))

  return members.length > 0
}

/**
 * GET /api/billing/subscriptions?referenceId=X - lists subscription rows
 * for a user or organization. Replaces better-auth's Stripe plugin client
 * `subscription.list()`, which no longer exists now that there's no
 * equivalent Razorpay plugin.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { referenceId: rawReferenceId } = QuerySchema.parse(Object.fromEntries(searchParams))
    const referenceId = rawReferenceId || session.user.id

    const authorized = await canViewBillingFor(session.user.id, referenceId)
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = await db
      .select()
      .from(subscription)
      .where(eq(subscription.referenceId, referenceId))

    return NextResponse.json({ data: rows })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Failed to list subscriptions', { error })
    return NextResponse.json({ error: 'Failed to list subscriptions' }, { status: 500 })
  }
}
