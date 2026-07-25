import { and, eq, or } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import { handleSubscriptionActivated } from '@/lib/billing/webhooks/subscription'
import { env } from '@/lib/env'
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
const PAID_SUBSCRIPTION_STATUSES = new Set(['authenticated', 'active'])

function addOneMonth(from: Date): Date {
  const end = new Date(from)
  end.setMonth(end.getMonth() + 1)
  return end
}

/**
 * POST /api/billing/subscription/sync - reconciles a pending upgrade against
 * Razorpay after the customer returns to the app (or reloads mid-payment).
 *
 * The id is whatever checkout handed the client: a subscription id for an
 * auto-debiting mandate, or an order id when the month was bought outright
 * on an account without Recurring Payments. Which one it is comes from our
 * own row rather than being guessed, because the two address different
 * Razorpay APIs and fetching the wrong one 404s.
 *
 * The webhook remains the source of truth in production, but it can't reach
 * a local dev machine and there's a window before it lands even in prod, so
 * this lets the UI settle immediately on return.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { subscriptionId: razorpayId } = RequestSchema.parse(body)

    // Only sync something this user actually started - the id arrives from
    // client-held state, so it can't be trusted on its own.
    const rows = await db
      .select()
      .from(subscription)
      .where(
        or(
          eq(subscription.razorpaySubscriptionId, razorpayId),
          eq(subscription.razorpayOrderId, razorpayId)
        )
      )
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

    // ── One-time order ──────────────────────────────────────────────────
    if (row.razorpayOrderId === razorpayId) {
      const order = await razorpay.orders.fetch(razorpayId)
      const notes = (order.notes || {}) as Record<string, string>
      const plan = notes.zelaxyPlan || row.plan

      if (order.status !== 'paid') {
        return NextResponse.json({
          mode: 'order',
          status: order.status,
          activated: false,
          // An unpaid order is still payable, so the customer can be handed
          // the very same one instead of being charged for a second.
          resumable: order.status === 'created' || order.status === 'attempted',
          plan,
          orderId: razorpayId,
          amountPaise: order.amount,
          keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        })
      }

      const periodStart = new Date()
      await handleSubscriptionActivated({
        razorpayOrderId: razorpayId,
        razorpayCustomerId: null,
        plan,
        referenceId: notes.zelaxyReferenceId || row.referenceId,
        seats: Number(notes.zelaxySeats) || row.seats || 1,
        currentStart: periodStart,
        currentEnd: addOneMonth(periodStart),
      })

      await db
        .update(subscription)
        .set({ cancelAtPeriodEnd: true })
        .where(eq(subscription.razorpayOrderId, razorpayId))

      logger.info('Settled a one-time plan purchase on return', { orderId: razorpayId, plan })
      return NextResponse.json({ mode: 'order', status: order.status, activated: true, plan })
    }

    // ── Auto-debiting subscription ──────────────────────────────────────
    const remote = await razorpay.subscriptions.fetch(razorpayId)
    const notes = (remote.notes || {}) as Record<string, string>
    const plan = notes.zelaxyPlan || row.plan

    if (!PAID_SUBSCRIPTION_STATUSES.has(remote.status)) {
      return NextResponse.json({
        mode: 'subscription',
        status: remote.status,
        activated: false,
        resumable: remote.status === 'created',
        plan,
        subscriptionId: razorpayId,
        shortUrl: remote.short_url,
      })
    }

    await handleSubscriptionActivated({
      razorpaySubscriptionId: razorpayId,
      razorpayCustomerId: remote.customer_id,
      plan,
      referenceId: notes.zelaxyReferenceId || row.referenceId,
      seats: remote.quantity || row.seats || 1,
      currentStart: remote.current_start ? new Date(remote.current_start * 1000) : null,
      currentEnd: remote.current_end ? new Date(remote.current_end * 1000) : null,
    })

    logger.info('Settled a subscription on return', { subscriptionId: razorpayId, plan })
    return NextResponse.json({
      mode: 'subscription',
      status: remote.status,
      activated: true,
      plan,
    })
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
