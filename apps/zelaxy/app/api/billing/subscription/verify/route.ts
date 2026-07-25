import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { verifyRazorpayPaymentSignature } from '@/lib/billing/razorpay/webhook-verify'
import { requireRazorpayClient } from '@/lib/billing/razorpay-client'
import { handleSubscriptionActivated } from '@/lib/billing/webhooks/subscription'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('SubscriptionVerifyAPI')

const RequestSchema = z.object({
  razorpay_subscription_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

/**
 * POST /api/billing/subscription/verify - called by the client right after
 * Razorpay Checkout's success handler fires. Verifies the signature, then
 * synchronously runs the same activation side effects the old better-auth
 * Stripe plugin's onSubscriptionComplete hook used to (org auto-creation,
 * usage-limit sync, billing-period init) so the user sees their upgraded
 * plan immediately rather than waiting on the webhook.
 *
 * The webhook (app/api/billing/webhooks/razorpay/route.ts) handling the
 * same subscription.activated/charged event is still the source of truth
 * for reliability (fires even if the user closes the tab before this call
 * completes) - handleSubscriptionActivated is idempotent enough that
 * running it twice (once here, once from the webhook) just re-applies the
 * same state.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } =
      RequestSchema.parse(body)

    if (!env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 })
    }

    const isValid = verifyRazorpayPaymentSignature(
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      env.RAZORPAY_KEY_SECRET
    )

    if (!isValid) {
      logger.warn('Invalid Razorpay subscription payment signature', {
        subscriptionId: razorpay_subscription_id,
      })
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const razorpay = requireRazorpayClient()
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id)
    const notes = (subscription.notes || {}) as Record<string, string>

    if (!notes.zelaxyReferenceId || !notes.zelaxyPlan) {
      logger.error('Razorpay subscription is missing zelaxy notes', {
        subscriptionId: razorpay_subscription_id,
      })
      return NextResponse.json(
        { error: 'Subscription is missing required metadata' },
        { status: 500 }
      )
    }

    const result = await handleSubscriptionActivated({
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayCustomerId: subscription.customer_id,
      plan: notes.zelaxyPlan,
      referenceId: notes.zelaxyReferenceId,
      seats: subscription.quantity || 1,
      currentStart: subscription.current_start ? new Date(subscription.current_start * 1000) : null,
      currentEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
    })

    return NextResponse.json({ success: true, referenceId: result.referenceId })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }

    logger.error('Failed to verify subscription payment', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify subscription payment' },
      { status: 500 }
    )
  }
}
