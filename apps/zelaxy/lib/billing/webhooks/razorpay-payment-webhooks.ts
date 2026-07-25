import { eq } from 'drizzle-orm'
import { findAccountByRazorpayCustomerId } from '@/lib/billing/core/billing'
import { sendEmail } from '@/lib/email/mailer'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, user, userStats } from '@/db/schema'

const logger = createLogger('RazorpayPaymentWebhooks')

/**
 * Minimal shape of the entities Razorpay includes in a webhook payload -
 * only the fields these handlers actually read. `notes` is the primary way
 * we resolve which internal user/organization an event belongs to (stamped
 * on every order/subscription/payment link we create); customer_id is a
 * fallback for events where notes might be absent.
 */
interface RazorpayPaymentLinkEntity {
  id: string
  amount: number
  amount_paid: number
  status: string
  reference_id: string | null
  notes?: Record<string, string> | null
  customer_id?: string | null
}

interface RazorpayPaymentEntity {
  id: string
  order_id: string | null
  amount: number
  email?: string | null
  notes?: Record<string, string> | null
  customer_id?: string | null
}

async function setBillingBlocked(userIds: string[], reason: string | null): Promise<void> {
  await Promise.all(
    userIds.map((userId) =>
      db
        .update(userStats)
        .set({ billingBlocked: reason !== null, billingBlockedReason: reason })
        .where(eq(userStats.userId, userId))
    )
  )
}

async function sendPaymentFailedEmail(userId: string, amountDue: number): Promise<void> {
  const userRecord = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (userRecord.length === 0 || !userRecord[0].email) return

  const html = `
    <h2>Payment link expired</h2>
    <p>Hi ${userRecord[0].name || 'there'},</p>
    <p>The payment link for your usage overage of ₹${amountDue.toFixed(2)} expired before it
    was paid. Your account access is on hold until this is resolved.</p>
    <p>Please contact support or check your account's billing settings for a new payment link.</p>
  `

  await sendEmail({
    to: userRecord[0].email,
    subject: 'Action required: overage payment link expired',
    html,
    emailType: 'transactional',
  })
}

async function resolveAccountUserIds(entity: {
  notes?: Record<string, string> | null
  customer_id?: string | null
}): Promise<{ userIds: string[]; accountType: 'user' | 'organization' } | null> {
  const notes = entity.notes || {}

  // Primary resolution: notes stamped on the order/subscription/payment link
  // at creation time (see lib/billing/razorpay/*.ts) - no lookup needed.
  if (notes.zelaxyUserId) {
    return { userIds: [notes.zelaxyUserId], accountType: 'user' }
  }
  if (notes.zelaxyOrganizationId) {
    const members = await db
      .select({ userId: member.userId })
      .from(member)
      .where(eq(member.organizationId, notes.zelaxyOrganizationId))
    return { userIds: members.map((m) => m.userId), accountType: 'organization' }
  }
  if (notes.zelaxyReferenceId) {
    const account = await findAccountByRazorpayCustomerId(notes.zelaxyReferenceId)
    if (account) {
      return {
        userIds: account.type === 'user' ? [account.userId] : account.memberUserIds,
        accountType: account.type,
      }
    }
  }

  // Fallback: reverse-lookup by Razorpay customer id.
  if (entity.customer_id) {
    const account = await findAccountByRazorpayCustomerId(entity.customer_id)
    if (account) {
      return {
        userIds: account.type === 'user' ? [account.userId] : account.memberUserIds,
        accountType: account.type,
      }
    }
  }

  return null
}

/**
 * Handle payment_link.paid: an overage billing payment link (see
 * lib/billing/razorpay/payment-links.ts) was paid. Unblocks the account, if
 * it was blocked - usage-period reset already happens synchronously right
 * after the payment link is created (see processUserOverageBilling /
 * processOrganizationOverageBilling / checkAndSettleThresholdForUser) -
 * this webhook's job is specifically to clear a billingBlocked flag that a
 * PRIOR expired payment link may have set.
 */
export async function handlePaymentLinkPaid(paymentLink: RazorpayPaymentLinkEntity) {
  const notes = paymentLink.notes || {}
  const isOverageBilling = 'zelaxyUserId' in notes || 'zelaxyOrganizationId' in notes

  if (!isOverageBilling) {
    logger.info('Ignoring non-overage-billing payment link', { paymentLinkId: paymentLink.id })
    return
  }

  const chargedAmount = paymentLink.amount_paid / 100 // paise -> rupees

  logger.info('Overage billing payment link paid', {
    paymentLinkId: paymentLink.id,
    chargedAmount,
    referenceId: paymentLink.reference_id,
  })

  const account = await resolveAccountUserIds(paymentLink)
  if (!account) {
    logger.warn('No user/organization found for payment link on payment success', {
      paymentLinkId: paymentLink.id,
    })
    return
  }

  await setBillingBlocked(account.userIds, null)

  logger.info('Cleared billing block after successful overage payment', {
    paymentLinkId: paymentLink.id,
    accountType: account.accountType,
    affectedUsers: account.userIds.length,
  })
}

/**
 * Handle payment_link.expired: an overage billing payment link wasn't paid
 * before it expired. Razorpay Payment Links have no auto-retry the way
 * Stripe invoices do, so "expired unpaid" is the closest signal to Stripe's
 * "payment failed after retries" - blocks access and notifies the user.
 */
export async function handlePaymentLinkExpired(paymentLink: RazorpayPaymentLinkEntity) {
  const notes = paymentLink.notes || {}
  const isOverageBilling = 'zelaxyUserId' in notes || 'zelaxyOrganizationId' in notes

  if (!isOverageBilling) {
    logger.info('Ignoring non-overage-billing payment link expiry', {
      paymentLinkId: paymentLink.id,
    })
    return
  }

  const failedAmount = paymentLink.amount / 100 // paise -> rupees

  logger.warn('Overage billing payment link expired unpaid', {
    paymentLinkId: paymentLink.id,
    failedAmount,
    referenceId: paymentLink.reference_id,
  })

  const account = await resolveAccountUserIds(paymentLink)
  if (!account) {
    logger.error('No user/organization found for payment link on expiry', {
      paymentLinkId: paymentLink.id,
    })
    return
  }

  const reason = `Overage payment link ${paymentLink.id} for ₹${failedAmount.toFixed(2)} expired unpaid`
  await setBillingBlocked(account.userIds, reason)

  logger.error('Blocked billing access after payment link expiry', {
    paymentLinkId: paymentLink.id,
    accountType: account.accountType,
    affectedUsers: account.userIds.length,
  })

  try {
    await Promise.all(account.userIds.map((userId) => sendPaymentFailedEmail(userId, failedAmount)))
  } catch (error) {
    logger.error('Failed to send payment-link-expired notification email', {
      paymentLinkId: paymentLink.id,
      error,
    })
  }
}

/**
 * Main dispatcher for payment-link-related webhook events.
 */
export async function handlePaymentLinkWebhook(
  eventType: string,
  paymentLink: RazorpayPaymentLinkEntity
) {
  switch (eventType) {
    case 'payment_link.paid':
      await handlePaymentLinkPaid(paymentLink)
      break
    case 'payment_link.expired':
      await handlePaymentLinkExpired(paymentLink)
      break
    default:
      logger.info('Unhandled payment_link webhook event', { eventType })
  }
}

export type { RazorpayPaymentEntity, RazorpayPaymentLinkEntity }
