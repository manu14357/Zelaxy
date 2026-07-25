import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { cancelRazorpaySubscription } from '@/lib/billing/razorpay/subscriptions'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, subscription } from '@/db/schema'

const logger = createLogger('SubscriptionCancelAPI')

const RequestSchema = z.object({
  referenceId: z.string().optional(),
  cancelAtCycleEnd: z.boolean().optional().default(true),
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
 * POST /api/billing/subscription/cancel - cancels the caller's (or, for an
 * owner/admin, their organization's) active Razorpay subscription.
 * cancelAtCycleEnd (default true) keeps access through the period already
 * paid for, matching the prior Stripe-era cancel-at-period-end UX.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { referenceId: rawReferenceId, cancelAtCycleEnd } = RequestSchema.parse(body)
    const referenceId = rawReferenceId || session.user.id

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

    await cancelRazorpaySubscription(activeSubscription.razorpaySubscriptionId, cancelAtCycleEnd)

    // The subscription.cancelled webhook (once Razorpay actually ends it)
    // is what marks the DB row canceled/ended and bills final overage - see
    // handleSubscriptionDeleted. If cancelAtCycleEnd is true, Razorpay keeps
    // charging/ending it at the current cycle's end, not immediately.
    logger.info('Requested Razorpay subscription cancellation', {
      referenceId,
      subscriptionId: activeSubscription.razorpaySubscriptionId,
      cancelAtCycleEnd,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to cancel subscription', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
