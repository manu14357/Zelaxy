import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import { handleSubscriptionActivated } from '@/lib/billing/webhooks/subscription'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, subscription } from '@/db/schema'

const logger = createLogger('SubscriptionSyncAPI')

const RequestSchema = z.object({
  subscriptionId: z.string(),
})

// Razorpay marks a subscription 'authenticated' once the mandate is approved
// but before the first charge settles, and 'active' once it's charged. Both
// mean "the customer completed checkout", so both should unlock the plan.
const PAID_STATUSES = new Set(['authenticated', 'active'])

/**
 * POST /api/billing/subscription/sync - reconciles a pending subscription
 * against Razorpay after the customer returns from the hosted checkout page.
 *
 * The subscription.activated webhook is still the source of truth in
 * production, but it can't reach a local dev machine, and even in production
 * there's a window between the customer returning and the webhook landing.
 * This lets the UI settle immediately on return instead of showing a stale
 * free plan. handleSubscriptionActivated is keyed on the Razorpay
 * subscription id, so running it here and again from the webhook just
 * re-applies the same state.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { subscriptionId } = RequestSchema.parse(body)

    // Only sync a subscription this user actually started - the id arrives
    // from client-held state, so it can't be trusted on its own.
    const rows = await db
      .select()
      .from(subscription)
      .where(eq(subscription.razorpaySubscriptionId, subscriptionId))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: 'Unknown subscription' }, { status: 404 })
    }

    if (row.referenceId !== session.user.id) {
      const memberships = await db
        .select()
        .from(member)
        .where(and(eq(member.userId, session.user.id), eq(member.organizationId, row.referenceId)))

      const role = memberships[0]?.role
      if (role !== 'owner' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const razorpay = requireRazorpayClient()
    const remote = await razorpay.subscriptions.fetch(subscriptionId)

    const notes = (remote.notes || {}) as Record<string, string>
    const referenceId = notes.zelaxyReferenceId || row.referenceId
    const plan = notes.zelaxyPlan || row.plan

    if (!PAID_STATUSES.has(remote.status)) {
      logger.info('Pending subscription is not paid yet', {
        subscriptionId,
        status: remote.status,
      })
      // `resumable` distinguishes "the customer can still pay this" from
      // "this one is dead" (cancelled/expired). Razorpay keeps a subscription
      // in `created` until the authorisation payment succeeds, so a customer
      // who reloaded mid-payment can be handed the very same subscription
      // again rather than having a second one created for the same intent.
      return NextResponse.json({
        status: remote.status,
        activated: false,
        resumable: remote.status === 'created',
        plan,
        shortUrl: remote.short_url,
      })
    }

    await handleSubscriptionActivated({
      razorpaySubscriptionId: subscriptionId,
      razorpayCustomerId: remote.customer_id,
      plan,
      referenceId,
      seats: remote.quantity || row.seats || 1,
      currentStart: remote.current_start ? new Date(remote.current_start * 1000) : null,
      currentEnd: remote.current_end ? new Date(remote.current_end * 1000) : null,
    })

    logger.info('Synced subscription after returning from hosted checkout', {
      subscriptionId,
      status: remote.status,
      plan,
    })

    return NextResponse.json({ status: remote.status, activated: true, plan })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to sync subscription', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}
