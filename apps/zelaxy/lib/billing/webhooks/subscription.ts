import { and, eq, inArray, type SQL, sql } from 'drizzle-orm'
import { getPlanMinimumCost, isPlanPerSeat } from '@/lib/billing/constants'
import {
  processOrganizationOverageBilling,
  processUserOverageBilling,
} from '@/lib/billing/core/billing'
import { adjustCreditBalance } from '@/lib/billing/credits/balance'
import { sendPlanReceiptEmail, sendPlanWelcomeEmail } from '@/lib/billing/emails'
import {
  invoiceIdForOrder,
  invoiceIdForSubscription,
  recordInvoice,
} from '@/lib/billing/invoices/ledger'
import { RAZORPAY_PLAN_PRICING } from '@/lib/billing/razorpay-pricing'
import { RECURRING_CHARGE_BLOCK_REASON } from '@/lib/billing/webhooks/razorpay-payment-webhooks'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import {
  member as memberTable,
  organization,
  session as sessionTable,
  subscription as subscriptionTable,
  userStats,
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
  /** Set when the plan came from a Razorpay Subscription (auto-debiting). */
  razorpaySubscriptionId?: string
  /**
   * Set instead when a single month was bought as a one-time Order, on an
   * account that cannot take recurring mandates. Exactly one of the two
   * identifies the row to activate.
   */
  razorpayOrderId?: string
  razorpayCustomerId: string | null
  /** The captured Razorpay payment id, when known (recorded on the invoice). */
  razorpayPaymentId?: string | null
  plan: string
  referenceId: string
  seats: number
  currentStart: Date | null
  currentEnd: Date | null
}

export interface HandleSubscriptionActivatedResult {
  /** The final referenceId - rewritten to a newly-created organization id for team plan purchases. */
  referenceId: string
  /** True only for the created->active transition (not renewals/duplicates); gates one-time side effects like the welcome email. */
  isFirstActivation: boolean
  /** True when this call wrote a NEW invoice row (not a duplicate); gates the per-charge receipt email. */
  invoiceRecorded: boolean
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

  // Order ids and subscription ids live in separate columns because they
  // address different Razorpay APIs, so match the row on whichever one this
  // activation actually came from.
  const matchesPaidRow = input.razorpayOrderId
    ? eq(subscriptionTable.razorpayOrderId, input.razorpayOrderId)
    : eq(subscriptionTable.razorpaySubscriptionId, input.razorpaySubscriptionId ?? '')

  logger.info('Processing subscription activation', {
    subscriptionId: input.razorpaySubscriptionId,
    orderId: input.razorpayOrderId,
    referenceId,
    plan: input.plan,
  })

  // Atomically claim the first activation. This handler runs at least twice per
  // activation - synchronously from the client verify route AND from the
  // subscription.activated / payment.captured webhook - and can run again on
  // reload via the sync route. Flipping the row to 'active' ONLY while it is
  // not already active is won by exactly one caller under row locking, giving a
  // race-safe "is this the first activation?" signal. The once-per-subscription
  // side effects (team-org creation, the prepaid credit grant, and the welcome
  // email) hang off this claim so a double-fire can't duplicate them - the
  // previous code re-ran the whole block on every call, minting a fresh
  // organization on each verify+webhook pair.
  const firstActivationClaim = await db
    .update(subscriptionTable)
    .set({
      status: 'active',
      razorpayCustomerId: input.razorpayCustomerId,
      seats: input.seats,
      periodStart: input.currentStart ?? undefined,
      periodEnd: input.currentEnd ?? undefined,
    })
    .where(and(matchesPaidRow, sql`${subscriptionTable.status} is distinct from 'active'`))
    .returning({ id: subscriptionTable.id })

  const isFirstActivation = firstActivationClaim.length > 0

  if (!isFirstActivation) {
    // Renewal charge or duplicate delivery: the row is already active. Still
    // move the live period/seat/customer fields forward (a renewal advances the
    // billing window), but skip every once-per-subscription side effect below.
    await db
      .update(subscriptionTable)
      .set({
        razorpayCustomerId: input.razorpayCustomerId,
        seats: input.seats,
        periodStart: input.currentStart ?? undefined,
        periodEnd: input.currentEnd ?? undefined,
      })
      .where(matchesPaidRow)
  }

  // Resolve the organization (team plans) and the paying user SEPARATELY - the
  // two must never be conflated. `input.referenceId` is a USER id for an
  // individual/first-time-team purchase, but an ORGANIZATION id when an
  // owner/admin manages an existing org's subscription (renewals, re-subscribe).
  // Filing an invoice under the wrong subject - or writing an org id into
  // billing_invoice.user_id (a FK to user.id) - is the bug class this replaces.
  let organizationId: string | null = null
  let payingUserId: string | null = null

  if (input.plan === 'team') {
    if (await isOrganizationId(input.referenceId)) {
      // Org-direct management: the subscription already belongs to an org.
      organizationId = input.referenceId
      referenceId = input.referenceId
      payingUserId = await getOrganizationOwnerId(organizationId)
    } else {
      // First-time team purchase (referenceId is the buyer). Ensure the org
      // exists exactly once - race-safe AND crash-recoverable (see
      // ensureTeamOrganization). Runs on every delivery, not just the first
      // claim, so a redelivery repairs a partially-created org.
      payingUserId = input.referenceId
      organizationId = await ensureTeamOrganization(
        matchesPaidRow,
        input.referenceId,
        input.razorpayCustomerId
      )
      referenceId = organizationId ?? input.referenceId
    }
  } else {
    // Individual (pro) subscription: referenceId is the user.
    payingUserId = input.referenceId
    if (input.razorpayCustomerId) {
      try {
        await db
          .update(userTable)
          .set({ razorpayCustomerId: input.razorpayCustomerId })
          .where(eq(userTable.id, input.referenceId))
      } catch (error) {
        logger.error('Failed to persist Razorpay customer id on user', {
          referenceId: input.referenceId,
          error,
        })
      }
    }
  }

  // Sync usage limits + initialize the billing period. These write user_stats
  // (a FK to user.id), so run them ONLY for individual references - passing an
  // org id would FK-violate user_stats.user_id. Team/enterprise usage is
  // computed live per member and billed through the org-overage path instead.
  if (organizationId === null) {
    try {
      const { syncUsageLimitsFromSubscription } = await import('@/lib/billing')
      const { initializeBillingPeriod } = await import('@/lib/billing/core/billing-periods')

      await syncUsageLimitsFromSubscription(referenceId)
      logger.info('Usage limits synced after subscription activation', { referenceId })

      if (input.currentStart && input.currentEnd) {
        await initializeBillingPeriod(referenceId, input.currentStart, input.currentEnd)
        logger.info('Billing period initialized for new subscription', { referenceId })
      }
    } catch (error) {
      logger.error(
        'Failed to sync usage limits or initialize billing period after subscription activation',
        { referenceId, error }
      )
    }
  }

  // Prepaid credit grant on upgrade, for individual (pro) plans only - credits
  // are user-scoped; org-level credits are a separate, unbuilt ledger. Two
  // guards: (1) money must have actually moved - a settled order or a charged
  // period - so an 'authenticated'-but-not-yet-charged mandate (currentStart
  // null) grants nothing, staying consistent with the invoice-skip below;
  // (2) the idempotencyKey (keyed on the subscription/order) makes the grant
  // apply exactly once across the verify+webhook double-fire AND across
  // renewals, while remaining RETRYABLE - a transient failure on one delivery
  // is simply re-attempted on the next, unlike a one-shot isFirstActivation gate
  // which would lose the grant forever. Runs after the usage sync so the
  // user_stats row exists. Denominated in the USD metering domain (the plan
  // minimum), matching how creditBalance is spent.
  if (
    (input.razorpayOrderId || input.currentStart) &&
    payingUserId &&
    organizationId === null &&
    !isPlanPerSeat(input.plan)
  ) {
    try {
      const grant = getPlanMinimumCost(input.plan)
      if (grant > 0) {
        await adjustCreditBalance(payingUserId, grant, 'purchase', {
          description: `${planLabel(input.plan)} plan activation credit`,
          idempotencyKey: `activation_${input.razorpaySubscriptionId ?? input.razorpayOrderId ?? input.referenceId}`,
        })
        logger.info('Granted prepaid credits on subscription activation', {
          userId: payingUserId,
          plan: input.plan,
          grant,
        })
      }
    } catch (error) {
      logger.error('Failed to grant prepaid credits on subscription activation', {
        userId: payingUserId,
        plan: input.plan,
        error,
      })
    }
  }

  // Recovery: a successful charge clears any failed-renewal dunning block that
  // subscription.halted set (symmetric with how a paid overage link clears its
  // block). Scoped to the recurring-charge reason via an exact match so it never
  // forgives an unrelated unpaid-overage block. Only on a real charge.
  if (input.razorpayOrderId || input.currentStart) {
    try {
      const blockedUserIds = organizationId
        ? (
            await db
              .select({ userId: memberTable.userId })
              .from(memberTable)
              .where(eq(memberTable.organizationId, organizationId))
          ).map((m) => m.userId)
        : payingUserId
          ? [payingUserId]
          : []
      if (blockedUserIds.length > 0) {
        await db
          .update(userStats)
          .set({ billingBlocked: false, billingBlockedReason: null })
          .where(
            and(
              inArray(userStats.userId, blockedUserIds),
              eq(userStats.billingBlockedReason, RECURRING_CHARGE_BLOCK_REASON)
            )
          )
      }
    } catch (error) {
      logger.error('Failed to clear dunning block on subscription activation', {
        referenceId,
        error,
      })
    }
  }

  // Persist a receipt/invoice row for this charge. Skip the pre-charge window: a
  // Razorpay subscription can be 'authenticated' (mandate approved) before its
  // first charge settles, when currentStart is null and no money has moved -
  // recording then prices nothing AND, because the id would differ from the
  // post-charge id, would duplicate the invoice/receipt. One-time orders always
  // carry a concrete period, so they always record. `created` (a NEW row was
  // written) is the once-per-payment gate a receipt email hangs off (Phase 2).
  let invoiceCreated = false
  if (input.razorpayOrderId || input.currentStart) {
    const invoiceId = input.razorpayOrderId
      ? invoiceIdForOrder(input.razorpayOrderId)
      : invoiceIdForSubscription(input.razorpaySubscriptionId ?? 'unknown', input.currentStart)
    const amountInr = computePlanChargeInr(input.plan, input.seats)
    const result = await recordInvoice({
      id: invoiceId,
      referenceId,
      userId: payingUserId,
      organizationId,
      type: input.razorpayOrderId ? 'plan_purchase' : 'subscription',
      status: 'paid',
      amountDue: amountInr,
      amountPaid: amountInr,
      currency: 'INR',
      description: `${planLabel(input.plan)} plan${input.seats > 1 ? ` × ${input.seats} seats` : ''}`,
      plan: input.plan,
      seats: input.seats,
      razorpayPaymentId: input.razorpayPaymentId ?? null,
      razorpayOrderId: input.razorpayOrderId ?? null,
      razorpaySubscriptionId: input.razorpaySubscriptionId ?? null,
      billingPeriodStart: input.currentStart,
      billingPeriodEnd: input.currentEnd,
      paidAt: new Date(),
    })
    invoiceCreated = result.created

    // Receipt email: gated on a NEWLY-written invoice, so exactly one caller of
    // the verify+webhook double-fire sends it, once per charge (incl. renewals).
    if (invoiceCreated && payingUserId) {
      await sendPlanReceiptEmail(payingUserId, {
        plan: input.plan,
        amountInr,
        seats: input.seats,
        periodStart: input.currentStart,
        periodEnd: input.currentEnd,
      })
    }
  }

  // Welcome email: once, on the first activation (the atomic claim guarantees a
  // single winner). Best-effort - a missed welcome email never blocks activation.
  if (isFirstActivation && payingUserId) {
    await sendPlanWelcomeEmail(payingUserId, { plan: input.plan })
  }

  return { referenceId, isFirstActivation, invoiceRecorded: invoiceCreated }
}

/**
 * Idempotently ensures a first-time team purchase has its auto-provisioned
 * organization, returning the org id (or null if the user row is missing).
 *
 * Everything runs inside ONE transaction that takes a `FOR UPDATE` lock on the
 * subscription row, which buys two guarantees the previous one-shot version
 * lacked:
 *  - Race-safe: concurrent activations (verify + webhook) serialize on the row
 *    lock; the first creates the org and re-points the row, the rest read the
 *    re-pointed row and reuse it - never a duplicate org.
 *  - Crash-recoverable: a partial failure (e.g. member insert throws after the
 *    org insert) rolls the whole thing back, so a later redelivery re-attempts
 *    from a clean slate instead of leaving an active subscription with no org.
 */
async function ensureTeamOrganization(
  matchesPaidRow: SQL,
  purchaserUserId: string,
  razorpayCustomerId: string | null
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const row = (
      await tx.select().from(subscriptionTable).where(matchesPaidRow).for('update').limit(1)
    )[0]
    if (!row) return null

    // Already re-pointed to an organization by a prior (committed) activation?
    // Reuse it - this is the idempotent fast path for renewals and duplicates.
    const existingOrg = await tx
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, row.referenceId))
      .limit(1)
    if (existingOrg.length > 0) return row.referenceId

    const userRecord = await tx
      .select()
      .from(userTable)
      .where(eq(userTable.id, purchaserUserId))
      .limit(1)
    if (userRecord.length === 0) return null

    const currentUser = userRecord[0]
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    const orgSlug = `${currentUser.name?.toLowerCase().replace(/\s+/g, '-') || 'team'}-${Date.now()}`

    await tx.insert(organization).values({
      id: orgId,
      name: `${currentUser.name || 'User'}'s Team`,
      slug: orgSlug,
      metadata: razorpayCustomerId ? { razorpayCustomerId } : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await tx.insert(memberTable).values({
      id: `member_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      userId: currentUser.id,
      organizationId: orgId,
      role: 'owner',
      createdAt: new Date(),
    })

    await tx.update(subscriptionTable).set({ referenceId: orgId }).where(matchesPaidRow)

    await tx
      .update(sessionTable)
      .set({ activeOrganizationId: orgId })
      .where(eq(sessionTable.userId, currentUser.id))

    logger.info('Auto-created organization for team subscription', {
      organizationId: orgId,
      userId: currentUser.id,
    })

    return orgId
  })
}

/** The owner of an organization (for receipts/emails), or null if none. */
async function getOrganizationOwnerId(organizationId: string): Promise<string | null> {
  const owner = await db
    .select({ userId: memberTable.userId })
    .from(memberTable)
    .where(and(eq(memberTable.organizationId, organizationId), eq(memberTable.role, 'owner')))
    .limit(1)
  return owner[0]?.userId ?? null
}

function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

/**
 * The INR amount actually charged for a plan month, from the same pricing
 * constant the checkout uses. Per-seat plans multiply by seat count; plans with
 * no purchasable INR price (free/enterprise) resolve to 0.
 */
function computePlanChargeInr(plan: string, seats: number): number {
  const pricing = RAZORPAY_PLAN_PRICING[plan as keyof typeof RAZORPAY_PLAN_PRICING]
  if (!pricing) return 0
  return isPlanPerSeat(plan) ? pricing.priceInr * seats : pricing.priceInr
}
