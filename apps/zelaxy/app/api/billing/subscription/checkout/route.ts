import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createPlanPurchaseOrder } from '@/lib/billing/razorpay/orders'
import { createRazorpaySubscription } from '@/lib/billing/razorpay/subscriptions'
import { isRazorpaySubscriptionPlan } from '@/lib/billing/razorpay-pricing'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, subscription } from '@/db/schema'

const logger = createLogger('SubscriptionCheckoutAPI')

const RequestSchema = z.object({
  plan: z.enum(['pro', 'team']),
  referenceId: z.string().optional(),
  seats: z.number().int().min(1).max(50).optional(),
  /**
   * Skip the subscription attempt and bill a single month directly. Set by
   * the client when a mandate was already refused mid-payment, which only
   * surfaces client-side (`reason: "recurring_payment_not_enabled"`) after
   * the subscription was created successfully - so the server can't know it
   * in advance on its own.
   */
  forceOneTime: z.boolean().optional(),
})

/**
 * True when Razorpay is refusing recurring for this merchant rather than
 * rejecting the request itself. The Plans/Subscriptions endpoints 401 for an
 * account without the product, which is indistinguishable from bad
 * credentials by status alone - so this is only ever consulted after the
 * caller has already authenticated successfully elsewhere in the request.
 */
function isRecurringUnavailableError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number })?.statusCode
  if (statusCode === 401 || statusCode === 400) return true

  const description = String(
    (error as { error?: { description?: string } })?.error?.description ??
      (error as Error)?.message ??
      ''
  ).toLowerCase()

  return (
    description.includes('recurring') ||
    description.includes('not enabled') ||
    description.includes('unauthorized')
  )
}

/**
 * Mirrors the authorization the better-auth Stripe plugin's
 * authorizeReference used to enforce: a user can always manage their own
 * subscription, or an organization's if they're its owner/admin.
 */
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
 * POST /api/billing/subscription/checkout - starts a plan upgrade.
 *
 * Prefers a real auto-debiting Razorpay Subscription and only falls back to
 * charging a single month as a one-time Order when the account can't do
 * recurring. Two separate Razorpay approvals gate subscriptions - API access
 * to the Plans/Subscriptions product, and Recurring Payments (RBI-regulated,
 * gated on business verification) - and a merchant without them cannot take
 * a mandate at all. Rather than hard-coding either behaviour, this asks
 * Razorpay and uses whichever it allows, so the moment recurring is approved
 * upgrades start auto-renewing with no code change.
 *
 * `mode` in the response tells the client which one it got.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { plan, seats, forceOneTime } = RequestSchema.parse(body)
    const referenceId = body.referenceId || session.user.id

    if (!isRazorpaySubscriptionPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const authorized = await canManageBillingFor(session.user.id, referenceId)
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const referenceType = referenceId === session.user.id ? 'user' : 'organization'
    const requestedSeats = seats || 1

    let recurring: { subscriptionId: string; shortUrl: string } | null = null
    if (!forceOneTime) {
      try {
        recurring = await createRazorpaySubscription(
          plan,
          referenceId,
          referenceType,
          requestedSeats
        )
      } catch (error) {
        // A merchant without the Subscriptions product gets a 401 from the
        // create call itself; anything else is a genuine fault worth failing on.
        if (!isRecurringUnavailableError(error)) throw error
        logger.info(
          'Recurring unavailable on this Razorpay account, billing one month as an order',
          {
            plan,
            referenceId,
          }
        )
      }
    }

    // Drop any stale pending attempts for this reference (e.g. the customer
    // opened Checkout, closed it without paying, and clicked Upgrade again)
    // so unfinished attempts don't pile up as orphaned 'created' rows.
    await db
      .delete(subscription)
      .where(and(eq(subscription.referenceId, referenceId), eq(subscription.status, 'created')))

    if (recurring) {
      // Record the pending subscription immediately (status 'created') so it
      // shows up in our DB even if the customer never completes the
      // authorization payment - handleSubscriptionActivated flips it to
      // 'active' once they do.
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        plan,
        referenceId,
        razorpaySubscriptionId: recurring.subscriptionId,
        status: 'created',
        seats: requestedSeats,
      })

      return NextResponse.json({
        mode: 'subscription',
        subscriptionId: recurring.subscriptionId,
        shortUrl: recurring.shortUrl,
      })
    }

    const order = await createPlanPurchaseOrder(plan, referenceId, referenceType, requestedSeats)

    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      plan,
      referenceId,
      razorpayOrderId: order.orderId,
      status: 'created',
      seats: requestedSeats,
    })

    return NextResponse.json({
      mode: 'order',
      orderId: order.orderId,
      amountPaise: order.amountPaise,
      amountRupees: order.amountRupees,
      keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to start subscription checkout', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start subscription checkout' },
      { status: 500 }
    )
  }
}
