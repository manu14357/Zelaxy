import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { updateRazorpaySubscriptionSeats } from '@/lib/billing/razorpay/subscriptions'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, subscription } from '@/db/schema'

const logger = createLogger('SubscriptionSeatsAPI')

const RequestSchema = z.object({
  referenceId: z.string(),
  seats: z.number().int().min(1).max(50),
})

async function canManageBillingFor(userId: string, referenceId: string): Promise<boolean> {
  if (referenceId === userId) return true

  const members = await db
    .select()
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, referenceId)))

  const m = members[0]
  return m?.role === 'owner' || m?.role === 'admin'
}

/**
 * POST /api/billing/subscription/seats - updates the seat (quantity) count
 * on an already-active team subscription. Replaces better-auth's Stripe
 * plugin client `subscription.upgrade({..., seats})` used for in-place seat
 * changes, which no longer exists - Razorpay subscriptions support updating
 * quantity directly without a new Checkout authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { referenceId, seats } = RequestSchema.parse(body)

    const authorized = await canManageBillingFor(session.user.id, referenceId)
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activeSubscriptions = await db
      .select()
      .from(subscription)
      .where(and(eq(subscription.referenceId, referenceId), eq(subscription.status, 'active')))
      .limit(1)

    const activeSubscription = activeSubscriptions[0]
    if (!activeSubscription?.razorpaySubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    await updateRazorpaySubscriptionSeats(activeSubscription.razorpaySubscriptionId, seats)

    await db.update(subscription).set({ seats }).where(eq(subscription.id, activeSubscription.id))

    return NextResponse.json({ success: true, seats })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to update subscription seats', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription seats' },
      { status: 500 }
    )
  }
}
