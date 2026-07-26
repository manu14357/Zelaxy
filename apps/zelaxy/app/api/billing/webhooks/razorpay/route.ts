import { createHash } from 'crypto'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { handleCreditPurchaseCompleted } from '@/lib/billing/credits/purchase'
import { verifyRazorpayWebhookSignature } from '@/lib/billing/razorpay/webhook-verify'
import { withPaymentWebhookIdempotency } from '@/lib/billing/webhooks/idempotency'
import {
  handlePaymentLinkWebhook,
  handleRecurringChargeFailed,
  type RazorpayPaymentEntity,
  type RazorpayPaymentLinkEntity,
} from '@/lib/billing/webhooks/razorpay-payment-webhooks'
import {
  handleSubscriptionActivated,
  handleSubscriptionDeleted,
} from '@/lib/billing/webhooks/subscription'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { subscription as subscriptionTable } from '@/db/schema'

const logger = createLogger('RazorpayWebhook')

const SUPPORTED_EVENTS = [
  'payment_link.paid',
  'payment_link.expired',
  'payment.captured',
  // Some Razorpay dashboards emit order.paid instead of (or alongside)
  // payment.captured for a one-time order; handle both so plan activation
  // never silently drops.
  'order.paid',
  'subscription.activated',
  'subscription.charged',
  'subscription.cancelled',
  'subscription.completed',
  // Failed auto-renewal (dunning): 'pending' = a charge failed, Razorpay will
  // retry; 'halted' = retries exhausted, gate access.
  'subscription.pending',
  'subscription.halted',
]

interface RazorpaySubscriptionEntity {
  id: string
  status: string
  customer_id: string | null
  quantity?: number
  current_start: number | null
  current_end: number | null
  ended_at: number | null
  notes?: Record<string, string> | null
}

interface RazorpayWebhookPayload {
  entity: string
  event: string
  payload: {
    payment_link?: { entity: RazorpayPaymentLinkEntity }
    payment?: { entity: RazorpayPaymentEntity }
    subscription?: { entity: RazorpaySubscriptionEntity }
  }
  created_at: number
}

async function dispatchEvent(event: RazorpayWebhookPayload): Promise<void> {
  switch (event.event) {
    case 'payment_link.paid':
    case 'payment_link.expired': {
      const paymentLink = event.payload.payment_link?.entity
      if (!paymentLink) {
        logger.warn('Razorpay webhook missing payment_link payload', { event: event.event })
        return
      }
      await handlePaymentLinkWebhook(event.event, paymentLink)
      return
    }
    case 'payment.captured':
    case 'order.paid': {
      // order.paid carries the same payment entity in its payload; both route
      // through the identical plan-activation / credit-purchase logic.
      const payment = event.payload.payment?.entity
      if (!payment) {
        logger.warn('Razorpay webhook missing payment payload', { event: event.event })
        return
      }

      const notes = (payment.notes || {}) as Record<string, string>

      // Plans bought as a one-time order (accounts without Recurring
      // Payments) activate here, the same way a mandate would via
      // subscription.activated. This is what covers the customer closing the
      // tab before the client-side verify call lands.
      if (notes.zelaxyOrderType === 'plan_purchase') {
        if (!payment.order_id || !notes.zelaxyReferenceId || !notes.zelaxyPlan) {
          logger.warn('Plan purchase payment missing order id or zelaxy notes', {
            paymentId: payment.id,
          })
          return
        }

        const periodStart = new Date()
        const periodEnd = new Date(periodStart)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        await handleSubscriptionActivated({
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          razorpayCustomerId: payment.customer_id ?? null,
          plan: notes.zelaxyPlan,
          referenceId: notes.zelaxyReferenceId,
          seats: Number(notes.zelaxySeats) || 1,
          currentStart: periodStart,
          currentEnd: periodEnd,
        })

        // No mandate means nothing renews on its own.
        await db
          .update(subscriptionTable)
          .set({ cancelAtPeriodEnd: true })
          .where(eq(subscriptionTable.razorpayOrderId, payment.order_id))
        return
      }

      await handleCreditPurchaseCompleted(payment)
      return
    }
    case 'subscription.activated':
    case 'subscription.charged': {
      const subscription = event.payload.subscription?.entity
      if (!subscription) {
        logger.warn('Razorpay webhook missing subscription payload', { event: event.event })
        return
      }
      const notes = subscription.notes || {}
      if (!notes.zelaxyReferenceId || !notes.zelaxyPlan) {
        logger.warn('Razorpay subscription webhook missing zelaxy notes', {
          subscriptionId: subscription.id,
        })
        return
      }
      await handleSubscriptionActivated({
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: subscription.customer_id,
        plan: notes.zelaxyPlan,
        referenceId: notes.zelaxyReferenceId,
        seats: subscription.quantity || 1,
        currentStart: subscription.current_start
          ? new Date(subscription.current_start * 1000)
          : null,
        currentEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
      })
      return
    }
    case 'subscription.cancelled':
    case 'subscription.completed': {
      const subscription = event.payload.subscription?.entity
      if (!subscription) {
        logger.warn('Razorpay webhook missing subscription payload', { event: event.event })
        return
      }

      const dbRows = await db
        .select()
        .from(subscriptionTable)
        .where(eq(subscriptionTable.razorpaySubscriptionId, subscription.id))
        .limit(1)

      const dbRow = dbRows[0]
      if (!dbRow) {
        logger.warn('No local subscription row found for cancelled Razorpay subscription', {
          subscriptionId: subscription.id,
        })
        return
      }

      await handleSubscriptionDeleted({
        id: dbRow.id,
        referenceId: dbRow.referenceId,
        plan: dbRow.plan,
        endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : undefined,
      })
      return
    }
    case 'subscription.halted':
    case 'subscription.pending': {
      const subscription = event.payload.subscription?.entity
      if (!subscription) {
        logger.warn('Razorpay webhook missing subscription payload', { event: event.event })
        return
      }
      // halted = retries exhausted (gate access); pending = will retry (notify only).
      await handleRecurringChargeFailed(subscription, {
        block: event.event === 'subscription.halted',
      })
      return
    }
    default:
      logger.info('Unhandled supported webhook event', { eventType: event.event })
  }
}

/**
 * Unified Razorpay webhook endpoint: /api/billing/webhooks/razorpay
 * Handles payment link, one-time payment, and subscription lifecycle
 * events. Replaces both the old /api/billing/webhooks/stripe route and
 * better-auth's internal Stripe plugin webhook handling - there's no
 * equivalent Razorpay plugin, so this is the single source of truth for
 * every Razorpay webhook now.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      logger.error('Missing Razorpay signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      logger.error('Missing Razorpay webhook secret configuration')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)
    if (!isValid) {
      logger.error('Invalid Razorpay webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody) as RazorpayWebhookPayload

    // Razorpay sends a unique id per webhook delivery in this header for
    // idempotency purposes. Fall back to a hash of the body if it's somehow
    // absent, rather than skipping the idempotency claim entirely.
    const eventId =
      request.headers.get('x-razorpay-event-id') ||
      createHash('sha256').update(rawBody).digest('hex')

    logger.info('Received Razorpay webhook', { eventId, eventType: event.event })

    if (!SUPPORTED_EVENTS.includes(event.event)) {
      logger.info('Ignoring unsupported webhook event', {
        eventId,
        eventType: event.event,
        supportedEvents: SUPPORTED_EVENTS,
      })
      return NextResponse.json({ received: true })
    }

    try {
      const { replayed } = await withPaymentWebhookIdempotency(eventId, event.event, () =>
        dispatchEvent(event)
      )

      logger.info('Successfully processed Razorpay webhook', {
        eventId,
        eventType: event.event,
        replayed,
      })

      return NextResponse.json({ received: true })
    } catch (processingError) {
      logger.error('Failed to process Razorpay webhook', {
        eventId,
        eventType: event.event,
        error: processingError,
      })

      // Return 500 so Razorpay retries the delivery.
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
    }
  } catch (error) {
    logger.error('Fatal error in Razorpay webhook handler', { error, url: request.url })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET endpoint for webhook health checks
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    webhook: 'razorpay',
    events: SUPPORTED_EVENTS,
  })
}
