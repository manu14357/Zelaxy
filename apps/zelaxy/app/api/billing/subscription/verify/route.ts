import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import {
  verifyRazorpayOrderPaymentSignature,
  verifyRazorpaySubscriptionPaymentSignature,
} from '@/lib/billing/razorpay/webhook-verify'
import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import { handleSubscriptionActivated } from '@/lib/billing/webhooks/subscription'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { subscription } from '@/db/schema'

const logger = createLogger('SubscriptionVerifyAPI')

/**
 * Checkout returns a subscription id for an auto-debiting mandate, or an
 * order id when a single month was bought outright - never both.
 */
const RequestSchema = z
  .object({
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    razorpay_subscription_id: z.string().optional(),
    razorpay_order_id: z.string().optional(),
  })
  .refine((v) => Boolean(v.razorpay_subscription_id) !== Boolean(v.razorpay_order_id), {
    message: 'Exactly one of razorpay_subscription_id or razorpay_order_id is required',
  })

/** One purchased month, for plans billed as one-time orders. */
function addOneMonth(from: Date): Date {
  const end = new Date(from)
  end.setMonth(end.getMonth() + 1)
  return end
}

/**
 * POST /api/billing/subscription/verify - called by the client right after
 * Razorpay Checkout's success handler fires. Verifies the signature, then
 * synchronously runs the same activation side effects the old better-auth
 * Stripe plugin's onSubscriptionComplete hook used to (org auto-creation,
 * usage-limit sync, billing-period init) so the user sees their upgraded
 * plan immediately rather than waiting on the webhook.
 *
 * The webhook (app/api/billing/webhooks/razorpay/route.ts) handling the
 * same event is still the source of truth for reliability (it fires even if
 * the user closes the tab before this call completes) -
 * handleSubscriptionActivated is keyed on the Razorpay id, so running it
 * twice just re-applies the same state.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      razorpay_subscription_id: subscriptionId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = RequestSchema.parse(body)

    if (!env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 })
    }

    // Razorpay signs these two flows with the operands in opposite orders -
    // see webhook-verify.ts. Getting it wrong rejects every valid payment.
    const isValid = subscriptionId
      ? verifyRazorpaySubscriptionPaymentSignature(
          subscriptionId,
          paymentId,
          signature,
          env.RAZORPAY_KEY_SECRET
        )
      : verifyRazorpayOrderPaymentSignature(orderId!, paymentId, signature, env.RAZORPAY_KEY_SECRET)

    if (!isValid) {
      logger.warn('Invalid Razorpay payment signature', { subscriptionId, orderId })
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const razorpay = requireRazorpayClient()

    if (subscriptionId) {
      const remote = await razorpay.subscriptions.fetch(subscriptionId)
      const notes = (remote.notes || {}) as Record<string, string>

      if (!notes.zelaxyReferenceId || !notes.zelaxyPlan) {
        logger.error('Razorpay subscription is missing zelaxy notes', { subscriptionId })
        return NextResponse.json(
          { error: 'Subscription is missing required metadata' },
          { status: 500 }
        )
      }

      const result = await handleSubscriptionActivated({
        razorpaySubscriptionId: subscriptionId,
        razorpayCustomerId: remote.customer_id,
        plan: notes.zelaxyPlan,
        referenceId: notes.zelaxyReferenceId,
        seats: remote.quantity || 1,
        currentStart: remote.current_start ? new Date(remote.current_start * 1000) : null,
        currentEnd: remote.current_end ? new Date(remote.current_end * 1000) : null,
      })

      return NextResponse.json({
        success: true,
        mode: 'subscription',
        referenceId: result.referenceId,
      })
    }

    // One-time order: the paid month starts now. Razorpay has no period of
    // its own for an order, so the period is ours to define.
    const remoteOrder = await razorpay.orders.fetch(orderId!)
    const notes = (remoteOrder.notes || {}) as Record<string, string>

    if (!notes.zelaxyReferenceId || !notes.zelaxyPlan) {
      logger.error('Razorpay order is missing zelaxy notes', { orderId })
      return NextResponse.json({ error: 'Order is missing required metadata' }, { status: 500 })
    }

    if (remoteOrder.status !== 'paid') {
      logger.warn('Order is not paid yet despite a valid signature', {
        orderId,
        status: remoteOrder.status,
      })
      return NextResponse.json({ error: 'Payment has not been captured yet' }, { status: 409 })
    }

    const periodStart = new Date()
    const result = await handleSubscriptionActivated({
      razorpayOrderId: orderId!,
      razorpayCustomerId: null,
      plan: notes.zelaxyPlan,
      referenceId: notes.zelaxyReferenceId,
      seats: Number(notes.zelaxySeats) || 1,
      currentStart: periodStart,
      currentEnd: addOneMonth(periodStart),
    })

    // Nothing auto-renews without a mandate, so the row is marked as ending
    // at period end rather than silently rolling over.
    await db
      .update(subscription)
      .set({ cancelAtPeriodEnd: true })
      .where(eq(subscription.razorpayOrderId, orderId!))

    return NextResponse.json({ success: true, mode: 'order', referenceId: result.referenceId })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to verify payment', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
