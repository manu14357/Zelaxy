import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createRazorpaySubscription } from '@/lib/billing/razorpay/subscriptions'
import { isRazorpaySubscriptionPlan } from '@/lib/billing/razorpay-pricing'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, subscription } from '@/db/schema'

const logger = createLogger('SubscriptionCheckoutAPI')

const RequestSchema = z.object({
  plan: z.enum(['pro', 'team']),
  referenceId: z.string().optional(),
  seats: z.number().int().min(1).max(50).optional(),
})

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
 * POST /api/billing/subscription/checkout - starts a Razorpay subscription
 * upgrade. Returns a subscription_id for the client to open Razorpay
 * Checkout with (in subscription mode) - unlike Stripe Checkout, Razorpay
 * Checkout is a client-side JS widget, not a redirect URL.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { plan, seats } = RequestSchema.parse(body)
    const referenceId = body.referenceId || session.user.id

    if (!isRazorpaySubscriptionPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const authorized = await canManageBillingFor(session.user.id, referenceId)
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const referenceType = referenceId === session.user.id ? 'user' : 'organization'
    const { subscriptionId, shortUrl } = await createRazorpaySubscription(
      plan,
      referenceId,
      referenceType,
      seats || 1
    )

    // Drop any stale pending attempts for this reference (e.g. the customer
    // opened Checkout, closed it without paying, and clicked Upgrade again)
    // so unfinished attempts don't pile up as orphaned 'created' rows.
    await db
      .delete(subscription)
      .where(and(eq(subscription.referenceId, referenceId), eq(subscription.status, 'created')))

    // Record the pending subscription immediately (status 'created') so it
    // shows up in our DB even if the customer never completes the
    // authorization payment - handleSubscriptionActivated flips it to
    // 'active' once they do.
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      plan,
      referenceId,
      razorpaySubscriptionId: subscriptionId,
      status: 'created',
      seats: seats || 1,
    })

    // shortUrl is Razorpay's hosted subscription page. The client navigates
    // to it rather than opening the Checkout widget in an iframe - see
    // openRazorpaySubscriptionCheckout for why.
    return NextResponse.json({ subscriptionId, shortUrl })
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
