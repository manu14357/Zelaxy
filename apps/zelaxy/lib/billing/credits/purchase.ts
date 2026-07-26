import { adjustCreditBalance } from '@/lib/billing/credits/balance'
import { sendCreditReceiptEmail } from '@/lib/billing/emails'
import { invoiceIdForPayment, recordInvoice } from '@/lib/billing/invoices/ledger'
import { createCreditPurchaseOrder } from '@/lib/billing/razorpay/orders'
import { convertInrPaymentToCreditUnits } from '@/lib/billing/razorpay-pricing'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('CreditPurchase')

export const MIN_CREDIT_PURCHASE = 100
export const MAX_CREDIT_PURCHASE = 50000

export interface CreditPurchaseCheckout {
  orderId: string
  amountPaise: number
  currency: 'INR'
  keyId: string
}

/**
 * Creates a Razorpay Order for a user buying prepaid credits. Unlike
 * Stripe Checkout, Razorpay Checkout is a client-side JS widget, not a
 * redirect URL - the caller opens it with this order_id and key_id (see
 * the buy-credits-dialog component). The balance is only credited once the
 * payment.captured webhook fires (lib/billing/razorpay/webhooks.ts), never
 * synchronously here.
 */
export async function createCreditPurchaseCheckout(
  userId: string,
  amountRupees: number
): Promise<CreditPurchaseCheckout> {
  if (amountRupees < MIN_CREDIT_PURCHASE || amountRupees > MAX_CREDIT_PURCHASE) {
    throw new Error(
      `Credit purchase amount must be between ₹${MIN_CREDIT_PURCHASE} and ₹${MAX_CREDIT_PURCHASE}`
    )
  }

  if (!env.RAZORPAY_KEY_ID) {
    throw new Error('RAZORPAY_KEY_ID is not configured')
  }

  const order = await createCreditPurchaseOrder(userId, amountRupees)

  logger.info('Created credit purchase order', {
    userId,
    amountRupees,
    orderId: order.orderId,
  })

  return {
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
  }
}

/**
 * Handles a Razorpay payment.captured webhook for a credit-purchase order
 * (identified by notes.zelaxyOrderType === 'credit_purchase'). Ignores any
 * other captured payment (e.g. a subscription authorization payment, which
 * the subscription webhook handler deals with separately).
 */
export async function handleCreditPurchaseCompleted(payment: {
  id: string
  order_id: string | null
  notes?: Record<string, string> | null
}) {
  const notes = payment.notes || {}

  if (notes.zelaxyOrderType !== 'credit_purchase') {
    logger.info('Ignoring non-credit-purchase payment', { paymentId: payment.id })
    return
  }

  const userId = notes.zelaxyUserId
  const amountRupees = Number.parseFloat(notes.zelaxyAmountRupees || '0')

  if (!userId || !(amountRupees > 0)) {
    logger.error('Credit purchase payment missing valid userId/amountRupees notes', {
      paymentId: payment.id,
      notes,
    })
    return
  }

  // creditBalance is consumed against the usage-metering budget domain, not
  // raw rupees - convert the INR payment before crediting it (see
  // convertInrPaymentToCreditUnits's doc comment for why).
  const creditUnits = convertInrPaymentToCreditUnits(amountRupees)

  // Idempotent on the payment id: the webhook idempotency wrapper can reclaim an
  // event stuck in 'processing' past the stale window and re-run this handler
  // after a crash. adjustCreditBalance dedups on the key inside its row lock, so
  // a redelivery credits the balance at most once - never double, never lost.
  await adjustCreditBalance(userId, creditUnits, 'purchase', {
    description: `Purchased ₹${amountRupees} in credits`,
    idempotencyKey: payment.id,
  })
  logger.info('Applied purchased credits to user balance', {
    userId,
    amountRupees,
    creditUnits,
    paymentId: payment.id,
  })

  // Record a receipt in the local ledger so the purchase shows in invoice
  // history and can be emailed. Idempotent on the payment id.
  const { created } = await recordInvoice({
    id: invoiceIdForPayment(payment.id),
    referenceId: userId,
    userId,
    type: 'credit_purchase',
    status: 'paid',
    amountDue: amountRupees,
    amountPaid: amountRupees,
    currency: 'INR',
    description: `Purchased ₹${amountRupees} in credits`,
    razorpayPaymentId: payment.id,
    razorpayOrderId: payment.order_id,
    paidAt: new Date(),
  })

  // Receipt email, gated on a NEWLY-written invoice so a stale redelivery
  // doesn't re-send it. Best-effort.
  if (created) {
    await sendCreditReceiptEmail(userId, { amountRupees, creditUnits })
  }
}
