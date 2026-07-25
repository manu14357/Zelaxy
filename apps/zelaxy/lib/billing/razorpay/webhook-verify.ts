import { createHmac, timingSafeEqual } from 'crypto'
import Razorpay from 'razorpay'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpayWebhookVerify')

/**
 * Verifies a Razorpay webhook's HMAC-SHA256 signature against the raw
 * request body, using the secret configured for that specific webhook
 * endpoint in the Razorpay Dashboard. Returns false (never throws) on any
 * verification failure so callers can uniformly respond with a 400.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    return Razorpay.validateWebhookSignature(rawBody, signature, secret)
  } catch (error) {
    logger.error('Failed to verify Razorpay webhook signature', { error })
    return false
  }
}

/**
 * Verifies the signature Razorpay Checkout hands back to the client after a
 * successful order/subscription payment (razorpay_signature). Unlike
 * webhook signatures, this uses RAZORPAY_KEY_SECRET (the API secret), not
 * the separately-configured webhook secret - implemented directly with
 * Node's crypto rather than the SDK's validatePaymentVerification helper,
 * which isn't part of its public/documented export surface. Per Razorpay's
 * docs, the signed payload is `${orderOrSubscriptionId}|${paymentId}`.
 */
export function verifyRazorpayPaymentSignature(
  orderOrSubscriptionId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  try {
    const expected = createHmac('sha256', keySecret)
      .update(`${orderOrSubscriptionId}|${paymentId}`)
      .digest('hex')

    const expectedBuffer = Buffer.from(expected)
    const signatureBuffer = Buffer.from(signature)
    if (expectedBuffer.length !== signatureBuffer.length) return false

    return timingSafeEqual(expectedBuffer, signatureBuffer)
  } catch (error) {
    logger.error('Failed to verify Razorpay payment signature', { error })
    return false
  }
}
