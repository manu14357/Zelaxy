import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import {
  createCreditPurchaseCheckout,
  MAX_CREDIT_PURCHASE,
  MIN_CREDIT_PURCHASE,
} from '@/lib/billing/credits/purchase'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('CreditPurchaseAPI')

const RequestSchema = z.object({
  amountRupees: z.number().min(MIN_CREDIT_PURCHASE).max(MAX_CREDIT_PURCHASE),
})

/**
 * POST /api/billing/credits/purchase - Start a prepaid-credits purchase.
 * Returns a Razorpay order_id + key_id for the client to open Razorpay
 * Checkout with (a client-side widget, not a redirect URL like Stripe
 * Checkout was). The balance is credited once Razorpay confirms payment via
 * the payment.captured webhook (see
 * app/api/billing/webhooks/razorpay/route.ts), not synchronously here.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amountRupees } = RequestSchema.parse(body)

    const checkout = await createCreditPurchaseCheckout(session.user.id, amountRupees)

    return NextResponse.json(checkout)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to create credit purchase checkout', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start credit purchase' },
      { status: 500 }
    )
  }
}
