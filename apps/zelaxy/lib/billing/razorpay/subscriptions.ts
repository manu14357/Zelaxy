import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import {
  getRazorpaySubscriptionPriceInr,
  type RazorpaySubscriptionPlan,
} from '@/lib/billing/razorpay-pricing'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpaySubscriptions')

// Charge for this many billing cycles before Razorpay requires the mandate
// to be re-authorized. 100 monthly cycles (~8 years) is effectively
// "indefinite" for a SaaS subscription without literally meaning forever,
// which Razorpay's API doesn't accept.
const SUBSCRIPTION_TOTAL_COUNT = 100

function getPlanId(plan: RazorpaySubscriptionPlan): string {
  const planId = plan === 'pro' ? env.RAZORPAY_PRO_PLAN_ID : env.RAZORPAY_TEAM_PLAN_ID
  if (!planId) {
    throw new Error(
      `No Razorpay Plan ID configured for the ${plan} plan. Create a Plan in the Razorpay Dashboard (amount ₹${getRazorpaySubscriptionPriceInr(plan)}, monthly) and set RAZORPAY_${plan.toUpperCase()}_PLAN_ID.`
    )
  }
  return planId
}

export interface CreatedRazorpaySubscription {
  subscriptionId: string
  shortUrl: string
}

/**
 * Creates a Razorpay Subscription in `created` status - the customer still
 * needs to complete the authorization payment (opening Razorpay Checkout
 * with this subscription_id) before it becomes `active`. `notes` is how
 * webhook handlers resolve which internal user/organization this
 * subscription belongs to (see findAccountByRazorpayNotes in
 * lib/billing/core/billing.ts) - Razorpay subscriptions don't take a
 * customer_id at creation time; the customer is linked automatically during
 * that authorization payment instead.
 */
export async function createRazorpaySubscription(
  plan: RazorpaySubscriptionPlan,
  referenceId: string,
  referenceType: 'user' | 'organization',
  seats = 1
): Promise<CreatedRazorpaySubscription> {
  const razorpay = requireRazorpayClient()
  const planId = getPlanId(plan)

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: SUBSCRIPTION_TOTAL_COUNT,
    quantity: seats,
    customer_notify: true,
    notes: {
      zelaxyReferenceId: referenceId,
      zelaxyReferenceType: referenceType,
      zelaxyPlan: plan,
    },
  })

  logger.info('Created Razorpay subscription', {
    subscriptionId: subscription.id,
    plan,
    referenceId,
    seats,
    status: subscription.status,
  })

  return { subscriptionId: subscription.id, shortUrl: subscription.short_url }
}

/**
 * Cancels a Razorpay subscription. `cancelAtCycleEnd=true` lets the customer
 * keep access through the period they already paid for, matching how the
 * existing Stripe-era cancel-at-period-end UX worked.
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<void> {
  const razorpay = requireRazorpayClient()
  await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd)
  logger.info('Cancelled Razorpay subscription', { subscriptionId, cancelAtCycleEnd })
}

/**
 * Updates the seat (quantity) count on an already-active Razorpay
 * subscription. Unlike Stripe, where seat changes went through a fresh
 * Checkout Session flow, Razorpay subscription mandates support updating
 * the billed quantity in place once authorized - no new customer
 * authorization needed. Takes effect on the next billing cycle by default.
 */
export async function updateRazorpaySubscriptionSeats(
  subscriptionId: string,
  seats: number
): Promise<void> {
  const razorpay = requireRazorpayClient()
  const subscription = await razorpay.subscriptions.fetch(subscriptionId)

  await razorpay.subscriptions.update(subscriptionId, {
    plan_id: subscription.plan_id,
    quantity: seats,
    schedule_change_at: 'now',
  })

  logger.info('Updated Razorpay subscription seats', { subscriptionId, seats })
}
