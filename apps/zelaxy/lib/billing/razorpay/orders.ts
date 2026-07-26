import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import {
  getRazorpaySubscriptionPriceInr,
  type RazorpaySubscriptionPlan,
} from '@/lib/billing/razorpay-pricing'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpayOrders')

export interface CreatedRazorpayOrder {
  orderId: string
  amountPaise: number
}

export interface CreatedPlanPurchaseOrder extends CreatedRazorpayOrder {
  amountRupees: number
}

/**
 * Charges one month of a paid plan as a one-time Razorpay Order.
 *
 * Plans are billed per purchased month rather than through Razorpay
 * Subscriptions because subscriptions need two separate Razorpay approvals
 * this account does not have: API access to the Plans/Subscriptions product
 * (which 401s outright), and Recurring Payments, which is RBI-regulated and
 * gated on business verification - the authorisation payment fails with
 * `reason: "recurring_payment_not_enabled"` until it's granted. Orders need
 * neither, so this path works on a plain activated account.
 *
 * The trade-off is real and deliberate: there is no mandate, so nothing
 * auto-debits at the end of the period. The customer buys the next month
 * themselves. Everything downstream (period start/end, usage limits,
 * overage) already reasons in terms of a dated billing period, so switching
 * this back to a true subscription later only changes how the period is
 * started - not what the rest of billing does with it.
 */
export async function createPlanPurchaseOrder(
  plan: RazorpaySubscriptionPlan,
  referenceId: string,
  referenceType: 'user' | 'organization',
  seats = 1
): Promise<CreatedPlanPurchaseOrder> {
  const razorpay = requireRazorpayClient()

  // Team is priced per seat; Pro ignores seats entirely.
  const billableSeats = plan === 'team' ? Math.max(1, seats) : 1
  const amountRupees = getRazorpaySubscriptionPriceInr(plan) * billableSeats
  const amountPaise = Math.round(amountRupees * 100)

  // See the credit-purchase receipt note below - same 40-char cap.
  const receipt = `plan-${crypto.randomUUID().slice(0, 24)}`

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    // Webhook handlers resolve the account from these, never from the
    // caller - see razorpay-payment-webhooks.ts.
    notes: {
      zelaxyOrderType: 'plan_purchase',
      zelaxyPlan: plan,
      zelaxyReferenceId: referenceId,
      zelaxyReferenceType: referenceType,
      zelaxySeats: billableSeats.toString(),
    },
  })

  logger.info('Created Razorpay order for plan purchase', {
    orderId: order.id,
    plan,
    referenceId,
    seats: billableSeats,
    amountRupees,
  })

  return { orderId: order.id, amountPaise, amountRupees }
}

/**
 * Creates a one-time Razorpay Order for a prepaid credit purchase. The
 * client opens Razorpay Checkout with this order_id; the balance is only
 * credited once the payment.captured webhook fires (or the client-side
 * verify step succeeds) - never synchronously here.
 */
export async function createCreditPurchaseOrder(
  userId: string,
  amountRupees: number
): Promise<CreatedRazorpayOrder> {
  const razorpay = requireRazorpayClient()
  const amountPaise = Math.round(amountRupees * 100)

  // Razorpay caps `receipt` at 40 characters - it's just a merchant
  // reference for display, not a resolution mechanism (notes.zelaxyUserId
  // is what webhook handlers actually key off), so a short random id is
  // enough. A raw userId + timestamp routinely blew past 40 chars for real
  // (non-short) user ids.
  const receipt = `credits-${crypto.randomUUID().slice(0, 20)}`

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      zelaxyUserId: userId,
      zelaxyOrderType: 'credit_purchase',
      zelaxyAmountRupees: amountRupees.toString(),
    },
  })

  logger.info('Created Razorpay order for credit purchase', {
    orderId: order.id,
    userId,
    amountRupees,
  })

  return { orderId: order.id, amountPaise }
}
