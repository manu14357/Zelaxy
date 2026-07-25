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

function verifySignedPayload(payload: string, signature: string, keySecret: string): boolean {
  try {
    const expected = createHmac('sha256', keySecret).update(payload).digest('hex')

    const expectedBuffer = Buffer.from(expected)
    const signatureBuffer = Buffer.from(signature)
    if (expectedBuffer.length !== signatureBuffer.length) return false

    return timingSafeEqual(expectedBuffer, signatureBuffer)
  } catch (error) {
    logger.error('Failed to verify Razorpay payment signature', { error })
    return false
  }
}

/**
 * Verifies the razorpay_signature returned by Checkout after a successful
 * one-time ORDER payment. Unlike webhook signatures this is signed with
 * RAZORPAY_KEY_SECRET (the API secret), not the webhook secret.
 *
 * Implemented with Node's crypto rather than the SDK's
 * validatePaymentVerification, which isn't part of its documented export
 * surface - but the payload format is taken from that same SDK
 * (dist/utils/razorpay-utils.js), which is authoritative.
 */
export function verifyRazorpayOrderPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  return verifySignedPayload(`${orderId}|${paymentId}`, signature, keySecret)
}

/**
 * Verifies the razorpay_signature returned by Checkout after a successful
 * SUBSCRIPTION authorisation payment.
 *
 * Note the operand order is the reverse of the order flow above -
 * `paymentId|subscriptionId`, not `subscriptionId|paymentId`. That asymmetry
 * is genuinely how Razorpay signs it (confirmed against the SDK's own
 * validatePaymentVerification), and signing it the other way round rejects
 * every legitimate subscription payment, so the two cases are deliberately
 * separate functions rather than one with a shared payload.
 */
export function verifyRazorpaySubscriptionPaymentSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  return verifySignedPayload(`${paymentId}|${subscriptionId}`, signature, keySecret)
}
