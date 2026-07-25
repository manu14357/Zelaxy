import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpayOrders')

export interface CreatedRazorpayOrder {
  orderId: string
  amountPaise: number
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
