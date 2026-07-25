import { adjustCreditBalance } from '@/lib/billing/credits/balance'
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

  await adjustCreditBalance(userId, creditUnits, 'purchase', {
    description: `Purchased ₹${amountRupees} in credits`,
    relatedInvoiceId: payment.id,
  })

  logger.info('Applied purchased credits to user balance', {
    userId,
    amountRupees,
    creditUnits,
    paymentId: payment.id,
  })
}
