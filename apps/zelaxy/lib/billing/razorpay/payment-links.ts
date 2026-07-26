import { createHash } from 'crypto'
import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpayPaymentLinks')

// Razorpay rejects reference_id longer than 40 characters. Callers build
// descriptive stems like `overage-${userId}-${billingPeriod}-...` for
// traceability, which routinely exceeds that once a real (non-short) user
// id is involved - discovered by actually hitting the Razorpay test API
// with a real user id, not just short test fixtures. Hash it down instead
// of truncating, so it stays deterministic (same input -> same output,
// which threshold-billing.ts's "stable per crossing" comment relies on)
// without silently colliding on a naive substring cut.
const RAZORPAY_REFERENCE_ID_MAX_LENGTH = 40

function toSafeReferenceId(referenceId: string): string {
  if (referenceId.length <= RAZORPAY_REFERENCE_ID_MAX_LENGTH) return referenceId
  return `ref-${createHash('sha256').update(referenceId).digest('hex').slice(0, 32)}`
}

export interface OverageBillingResult {
  success: boolean
  chargedAmount?: number
  paymentLinkId?: string
  shortUrl?: string
  error?: string
}

/**
 * Bills usage overage via a Razorpay Payment Link rather than an
 * auto-debit. Razorpay has no direct equivalent of Stripe's "charge the
 * customer's saved card for an arbitrary amount automatically" for a plain
 * Subscription mandate - that requires Razorpay's separate Recurring
 * Payments / "charge at will" tokenization flow, which needs its own
 * approval from Razorpay and isn't assumed to be set up here. A payment
 * link is the honest, robust alternative: the customer gets a link (email +
 * in-app), pays it, done.
 *
 * Unlike createOverageBillingInvoice's old Stripe implementation, this does
 * NOT do its own check-then-act duplicate lookup before creating the link -
 * the Razorpay Payment Links API has no query-by-reference-id lookup to do
 * that against. Callers (processUserOverageBilling,
 * checkAndSettleThresholdForUser) already row-lock and claim
 * userStats.billedOverageThisPeriod before calling this, which is what
 * actually prevents the same overage delta from being billed twice -
 * `referenceId` here is for traceability in the Razorpay dashboard, not
 * automated dedup.
 */
export async function createOverageBillingPaymentLink(
  customerName: string,
  customerEmail: string,
  overageAmountRupees: number,
  description: string,
  notes: Record<string, string>,
  referenceId: string
): Promise<OverageBillingResult> {
  try {
    if (overageAmountRupees <= 0) {
      logger.info('No overage to bill', { customerEmail, overageAmountRupees })
      return { success: true, chargedAmount: 0 }
    }

    const razorpay = requireRazorpayClient()

    // 7-day expiry: Razorpay Payment Links have no auto-retry the way
    // Stripe invoices do, so an explicit expiry is what makes the
    // payment_link.expired webhook event a meaningful "payment failed"
    // signal (see lib/billing/webhooks/razorpay-payment-webhooks.ts)
    // instead of the link sitting open indefinitely.
    const expireBy = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60

    const safeReferenceId = toSafeReferenceId(referenceId)

    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(overageAmountRupees * 100),
      currency: 'INR',
      description,
      customer: { name: customerName, email: customerEmail },
      notify: { email: true, sms: false },
      reference_id: safeReferenceId,
      expire_by: expireBy,
      notes,
    })

    logger.info('Created overage billing payment link', {
      paymentLinkId: paymentLink.id,
      amount: overageAmountRupees,
      customerEmail,
      referenceId: safeReferenceId,
    })

    return {
      success: true,
      chargedAmount: overageAmountRupees,
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
    }
  } catch (error) {
    logger.error('Failed to create overage billing payment link', {
      customerEmail,
      overageAmountRupees,
      description,
      error,
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
