import { eq } from 'drizzle-orm'
import { findAccountByRazorpayCustomerId } from '@/lib/billing/core/billing'
import { sendPaymentFailedNotice } from '@/lib/billing/emails'
import { invoiceIdForPaymentLink, recordInvoice } from '@/lib/billing/invoices/ledger'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, userStats } from '@/db/schema'

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

// The exact billingBlockedReason written by a failed recurring charge. Shared
// so the recovery path (handleSubscriptionActivated) can clear ONLY this kind
// of block on a successful charge, never an unrelated unpaid-overage block.
export const RECURRING_CHARGE_BLOCK_REASON =
  'A recurring charge on your Zelaxy subscription could not be collected.'

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
  // Subscriptions/plan orders stamp {zelaxyReferenceId, zelaxyReferenceType}
  // (NOT zelaxyUserId/zelaxyOrganizationId). Resolve directly from the type -
  // referenceId is a user.id / organization.id, so it must NOT be fed to the
  // Razorpay-customer-id lookup (a disjoint id space that would never match).
  if (notes.zelaxyReferenceId) {
    if (notes.zelaxyReferenceType === 'organization') {
      const members = await db
        .select({ userId: member.userId })
        .from(member)
        .where(eq(member.organizationId, notes.zelaxyReferenceId))
      return { userIds: members.map((m) => m.userId), accountType: 'organization' }
    }
    // 'user' (or unset): the reference id is the user id.
    return { userIds: [notes.zelaxyReferenceId], accountType: 'user' }
  }

  // Fallback: reverse-lookup by Razorpay customer id (events without notes).
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

  const paidReferenceId = notes.zelaxyOrganizationId || notes.zelaxyUserId || account.userIds[0]
  if (paidReferenceId) {
    await recordInvoice({
      id: invoiceIdForPaymentLink(paymentLink.id),
      referenceId: paidReferenceId,
      userId: notes.zelaxyUserId || account.userIds[0] || null,
      organizationId: notes.zelaxyOrganizationId || null,
      type: 'overage',
      status: 'paid',
      amountDue: chargedAmount,
      amountPaid: chargedAmount,
      currency: 'INR',
      description: 'Usage overage',
      razorpayPaymentLinkId: paymentLink.id,
      paidAt: new Date(),
    })
  }

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

  const expiredReferenceId = notes.zelaxyOrganizationId || notes.zelaxyUserId || account.userIds[0]
  if (expiredReferenceId) {
    await recordInvoice({
      id: invoiceIdForPaymentLink(paymentLink.id),
      referenceId: expiredReferenceId,
      userId: notes.zelaxyUserId || account.userIds[0] || null,
      organizationId: notes.zelaxyOrganizationId || null,
      type: 'overage',
      status: 'expired',
      amountDue: failedAmount,
      amountPaid: 0,
      currency: 'INR',
      description: 'Usage overage (unpaid)',
      razorpayPaymentLinkId: paymentLink.id,
    })
  }

  logger.error('Blocked billing access after payment link expiry', {
    paymentLinkId: paymentLink.id,
    accountType: account.accountType,
    affectedUsers: account.userIds.length,
  })

  try {
    await Promise.all(
      account.userIds.map((userId) =>
        sendPaymentFailedNotice(userId, {
          amountInr: failedAmount,
          reason:
            'The payment link for your usage overage expired before it was paid. Your account access is on hold until this is resolved.',
        })
      )
    )
  } catch (error) {
    logger.error('Failed to send payment-link-expired notification email', {
      paymentLinkId: paymentLink.id,
      error,
    })
  }
}

/**
 * Handle a FAILED recurring charge - a Razorpay auto-debit subscription that
 * halted/paused (subscription.halted / subscription.pending) or an outright
 * payment.failed. This is the dunning path the Stripe migration dropped: under
 * Stripe, invoice.payment_failed blocked access and notified; here nothing
 * handled these, so a customer whose renewal failed kept full access silently.
 * Blocks access and emails the affected user(s).
 */
export async function handleRecurringChargeFailed(
  entity: {
    id?: string
    notes?: Record<string, string> | null
    customer_id?: string | null
  },
  opts: { amountInr?: number; block?: boolean } = {}
): Promise<void> {
  const { amountInr, block = true } = opts
  const account = await resolveAccountUserIds(entity)
  if (!account) {
    logger.error('No user/organization found for failed recurring charge', { id: entity.id })
    return
  }

  // Only gate access once retries are exhausted (subscription.halted). A soft
  // failure that Razorpay will retry (subscription.pending) just notifies.
  if (block) {
    await setBillingBlocked(account.userIds, RECURRING_CHARGE_BLOCK_REASON)
    logger.error('Blocked billing access after failed recurring charge', {
      id: entity.id,
      accountType: account.accountType,
      affectedUsers: account.userIds.length,
    })
  } else {
    logger.warn('Recurring charge failed; will retry (not blocking yet)', {
      id: entity.id,
      accountType: account.accountType,
      affectedUsers: account.userIds.length,
    })
  }

  try {
    await Promise.all(
      account.userIds.map((userId) =>
        sendPaymentFailedNotice(userId, {
          amountInr,
          reason:
            'An automatic charge for your Zelaxy subscription could not be collected. Your account access is on hold until this is resolved.',
        })
      )
    )
  } catch (error) {
    logger.error('Failed to send recurring-charge-failed notification email', {
      id: entity.id,
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
