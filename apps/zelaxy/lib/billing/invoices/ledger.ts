import { desc, eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { billingInvoice } from '@/db/schema'

const logger = createLogger('BillingInvoiceLedger')

export type BillingInvoiceType =
  | 'subscription'
  | 'plan_purchase'
  | 'overage'
  | 'credit_purchase'
  | 'other'

export type BillingInvoiceStatus = 'created' | 'paid' | 'failed' | 'expired' | 'refunded'

export type BillingInvoiceRow = typeof billingInvoice.$inferSelect

export interface RecordInvoiceInput {
  /**
   * Deterministic primary key derived from the Razorpay entity (use one of the
   * invoiceIdFor* helpers). Repeated deliveries of the same payment must
   * produce the same id so they converge on one row.
   */
  id: string
  referenceId: string
  userId?: string | null
  organizationId?: string | null
  type: BillingInvoiceType
  status?: BillingInvoiceStatus
  amountDue?: number
  amountPaid?: number
  currency?: string
  description?: string | null
  plan?: string | null
  seats?: number | null
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
  razorpaySubscriptionId?: string | null
  razorpayPaymentLinkId?: string | null
  hostedInvoiceUrl?: string | null
  billingPeriodStart?: Date | null
  billingPeriodEnd?: Date | null
  metadata?: Record<string, unknown> | null
  paidAt?: Date | null
}

/**
 * Idempotently records a billing invoice. Returns whether a NEW row was
 * created (`false` = this exact payment was already recorded), which callers
 * use as the once-per-payment gate for sending a receipt email. Never throws
 * for a duplicate - a verify+webhook double-fire or a webhook retry simply
 * no-ops on the conflicting primary key.
 */
export async function recordInvoice(input: RecordInvoiceInput): Promise<{ created: boolean }> {
  try {
    const inserted = await db
      .insert(billingInvoice)
      .values({
        id: input.id,
        referenceId: input.referenceId,
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        type: input.type,
        status: input.status ?? 'paid',
        amountDue: (input.amountDue ?? 0).toString(),
        amountPaid: (input.amountPaid ?? 0).toString(),
        currency: input.currency ?? 'INR',
        description: input.description ?? null,
        plan: input.plan ?? null,
        seats: input.seats ?? null,
        razorpayPaymentId: input.razorpayPaymentId ?? null,
        razorpayOrderId: input.razorpayOrderId ?? null,
        razorpaySubscriptionId: input.razorpaySubscriptionId ?? null,
        razorpayPaymentLinkId: input.razorpayPaymentLinkId ?? null,
        hostedInvoiceUrl: input.hostedInvoiceUrl ?? null,
        billingPeriodStart: input.billingPeriodStart ?? null,
        billingPeriodEnd: input.billingPeriodEnd ?? null,
        metadata: input.metadata ?? null,
        paidAt: input.paidAt ?? null,
      })
      .onConflictDoNothing({ target: billingInvoice.id })
      .returning({ id: billingInvoice.id })

    const created = inserted.length > 0
    if (created) {
      logger.info('Recorded billing invoice', { id: input.id, type: input.type })
    }
    return { created }
  } catch (error) {
    // Never let ledger persistence break a payment-success flow - the plan is
    // already activated / credits already granted by this point. Log and move
    // on; the row can be reconstructed from Razorpay if needed.
    logger.error('Failed to record billing invoice', { id: input.id, error })
    return { created: false }
  }
}

export async function listInvoicesForReference(
  referenceId: string,
  limit: number
): Promise<BillingInvoiceRow[]> {
  return db
    .select()
    .from(billingInvoice)
    .where(eq(billingInvoice.referenceId, referenceId))
    .orderBy(desc(billingInvoice.createdAt))
    .limit(limit)
}

/** One one-time plan Order = one invoice. */
export function invoiceIdForOrder(orderId: string): string {
  return `inv_order_${orderId}`
}

/**
 * One invoice per subscription per billing period: the initial activation and
 * the webhook that mirrors it collapse to the same id, while each renewal
 * (a new period) gets its own receipt.
 */
export function invoiceIdForSubscription(subscriptionId: string, periodStart: Date | null): string {
  const period = periodStart ? Math.floor(periodStart.getTime() / 1000) : 'na'
  return `inv_sub_${subscriptionId}_${period}`
}

/** One captured payment (credit purchase) = one invoice. */
export function invoiceIdForPayment(paymentId: string): string {
  return `inv_pay_${paymentId}`
}

/** One overage payment link = one invoice. */
export function invoiceIdForPaymentLink(paymentLinkId: string): string {
  return `inv_pl_${paymentLinkId}`
}
