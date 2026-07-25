import { eq } from 'drizzle-orm'
import {
  processOrganizationOverageBilling,
  processUserOverageBilling,
} from '@/lib/billing/core/billing'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import {
  member as memberTable,
  organization,
  session as sessionTable,
  subscription as subscriptionTable,
  user as userTable,
} from '@/db/schema'

const logger = createLogger('SubscriptionWebhooks')

export interface HandleSubscriptionDeletedResult {
  referenceId: string
  isOrganization: boolean
  finalOverageCharged: number
  finalPaymentLinkId?: string
}

async function isOrganizationId(referenceId: string): Promise<boolean> {
  const orgRecord = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, referenceId))
    .limit(1)
  return orgRecord.length > 0
}

async function markSubscriptionEnded(
  subscriptionId: string,
  canceledAt: Date,
  endedAt: Date
): Promise<void> {
  await db
    .update(subscriptionTable)
    .set({ status: 'canceled', canceledAt, endedAt })
    .where(eq(subscriptionTable.id, subscriptionId))
}

/**
 * Handles a Razorpay subscription.cancelled/completed event: bills any
 * remaining unbilled overage via a final payment link, resets the usage
 * period (both already done together by
 * processUserOverageBilling/processOrganizationOverageBilling), and marks
 * the subscription row canceled/ended.
 *
 * This used to be a bare `logger.info` and nothing else — no final invoice,
 * no usage reset, no record of when the subscription actually ended.
 *
 * NOT implemented here: restoring each org member's individual plan / seat
 * limits, or detaching the organization's workspaces. Zelaxy has no existing
 * "personal plan fallback" or "detach workspace from org" mechanism to
 * mirror (unlike the reference app this was compared against) — usage
 * limits are already computed live from current subscription status
 * (see calculateDefaultUsageLimit), so members naturally fall back to
 * free-tier limits once the org subscription is gone, without needing an
 * explicit restore step. Inventing a workspace-detach step without a clear,
 * tested design would risk accidentally revoking legitimate workspace
 * access — that needs an explicit product decision, not a guess baked into
 * a webhook handler.
 */
export async function handleSubscriptionDeleted(subscriptionRecord: {
  id: string
  referenceId: string
  plan: string
  canceledAt?: Date
  endedAt?: Date
}): Promise<HandleSubscriptionDeletedResult> {
  const { id: subscriptionId, referenceId, plan } = subscriptionRecord
  const canceledAt = subscriptionRecord.canceledAt ?? new Date()
  const endedAt = subscriptionRecord.endedAt ?? new Date()

  logger.info('Processing subscription deletion', { subscriptionId, referenceId, plan })

  if (plan === 'free') {
    // Free plan "deletion" is a no-op billing-wise — nothing was ever charged.
    await markSubscriptionEnded(subscriptionId, canceledAt, endedAt)
    return { referenceId, isOrganization: false, finalOverageCharged: 0 }
  }

  const isOrganization = await isOrganizationId(referenceId)

  let finalOverageCharged = 0
  let finalPaymentLinkId: string | undefined

  try {
    const result = isOrganization
      ? await processOrganizationOverageBilling(referenceId)
      : await processUserOverageBilling(referenceId)

    if (result.success) {
      finalOverageCharged = result.chargedAmount || 0
      finalPaymentLinkId = result.paymentLinkId
    } else {
      logger.error('Failed to bill final overage on subscription deletion', {
        subscriptionId,
        referenceId,
        isOrganization,
        error: result.error,
      })
    }
  } catch (error) {
    // Don't let a billing failure block cleanup — the subscription still
    // needs to be marked ended so it stops showing as active elsewhere.
    logger.error('Exception while billing final overage on subscription deletion', {
      subscriptionId,
      referenceId,
      isOrganization,
      error,
    })
  }

  await markSubscriptionEnded(subscriptionId, canceledAt, endedAt)

  logger.info('Completed subscription deletion processing', {
    subscriptionId,
    referenceId,
    isOrganization,
    finalOverageCharged,
    finalPaymentLinkId,
  })

  return { referenceId, isOrganization, finalOverageCharged, finalPaymentLinkId }
}

export interface HandleSubscriptionActivatedInput {
  razorpaySubscriptionId: string
  razorpayCustomerId: string | null
  plan: string
  referenceId: string
  seats: number
  currentStart: Date | null
  currentEnd: Date | null
}

export interface HandleSubscriptionActivatedResult {
  /** The final referenceId - rewritten to a newly-created organization id for team plan purchases. */
  referenceId: string
}

/**
 * Handles a Razorpay subscription.activated/subscription.charged event for
 * a subscription that isn't yet marked 'active' in our DB (first
 * authorization, or the first successful renewal charge) - this is where
 * the org-auto-creation-for-team-plans, usage-limit-sync, and
 * billing-period-initialization side effects that used to live in
 * better-auth's Stripe plugin `onSubscriptionComplete` hook now happen,
 * since there's no equivalent Razorpay plugin to hook into.
 */
export async function handleSubscriptionActivated(
  input: HandleSubscriptionActivatedInput
): Promise<HandleSubscriptionActivatedResult> {
  let referenceId = input.referenceId

  logger.info('Processing subscription activation', {
    subscriptionId: input.razorpaySubscriptionId,
    referenceId,
    plan: input.plan,
  })

  await db
    .update(subscriptionTable)
    .set({
      status: 'active',
      razorpayCustomerId: input.razorpayCustomerId,
      seats: input.seats,
      periodStart: input.currentStart ?? undefined,
      periodEnd: input.currentEnd ?? undefined,
    })
    .where(eq(subscriptionTable.razorpaySubscriptionId, input.razorpaySubscriptionId))

  // Auto-create an organization for team plan purchases (mirrors the old
  // better-auth Stripe plugin's onSubscriptionComplete behavior) - the
  // purchaser becomes the org's owner and the subscription is re-pointed to
  // reference the new organization instead of the individual user.
  if (input.plan === 'team') {
    try {
      const userRecord = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, referenceId))
        .limit(1)

      if (userRecord.length > 0) {
        const currentUser = userRecord[0]
        const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        const orgSlug = `${currentUser.name?.toLowerCase().replace(/\s+/g, '-') || 'team'}-${Date.now()}`

        await db.insert(organization).values({
          id: orgId,
          name: `${currentUser.name || 'User'}'s Team`,
          slug: orgSlug,
          metadata: input.razorpayCustomerId
            ? { razorpayCustomerId: input.razorpayCustomerId }
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await db.insert(memberTable).values({
          id: `member_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          userId: currentUser.id,
          organizationId: orgId,
          role: 'owner',
          createdAt: new Date(),
        })

        await db
          .update(subscriptionTable)
          .set({ referenceId: orgId })
          .where(eq(subscriptionTable.razorpaySubscriptionId, input.razorpaySubscriptionId))

        await db
          .update(sessionTable)
          .set({ activeOrganizationId: orgId })
          .where(eq(sessionTable.userId, currentUser.id))

        logger.info('Auto-created organization for team subscription', {
          organizationId: orgId,
          userId: currentUser.id,
          subscriptionId: input.razorpaySubscriptionId,
        })

        referenceId = orgId
      }
    } catch (error) {
      logger.error('Failed to auto-create organization for team subscription', {
        subscriptionId: input.razorpaySubscriptionId,
        referenceId,
        error,
      })
    }
  } else if (input.razorpayCustomerId) {
    // Individual (pro) subscription - persist the Razorpay customer id for
    // future reuse/webhook resolution.
    try {
      await db
        .update(userTable)
        .set({ razorpayCustomerId: input.razorpayCustomerId })
        .where(eq(userTable.id, referenceId))
    } catch (error) {
      logger.error('Failed to persist Razorpay customer id on user', { referenceId, error })
    }
  }

  // Sync usage limits and initialize the billing period for the (possibly
  // rewritten) referenceId.
  try {
    const { syncUsageLimitsFromSubscription } = await import('@/lib/billing')
    const { initializeBillingPeriod } = await import('@/lib/billing/core/billing-periods')

    await syncUsageLimitsFromSubscription(referenceId)
    logger.info('Usage limits synced after subscription activation', { referenceId })

    if (input.currentStart && input.currentEnd) {
      await initializeBillingPeriod(referenceId, input.currentStart, input.currentEnd)
      logger.info('Billing period initialized for new subscription', {
        referenceId,
        billingStart: input.currentStart,
        billingEnd: input.currentEnd,
      })
    }
  } catch (error) {
    logger.error(
      'Failed to sync usage limits or initialize billing period after subscription activation',
      { referenceId, error }
    )
  }

  return { referenceId }
}
