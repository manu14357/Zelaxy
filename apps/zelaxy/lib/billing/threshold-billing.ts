import { eq, inArray } from 'drizzle-orm'
import { getPlanPricing } from '@/lib/billing/core/billing'
import { getHighestPrioritySubscription } from '@/lib/billing/core/subscription'
import type { CreditTransactionType } from '@/lib/billing/credits/balance'
import { createOverageBillingPaymentLink } from '@/lib/billing/razorpay/payment-links'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { creditTransactions, subscription, user, userStats } from '@/db/schema'

const logger = createLogger('ThresholdBilling')

/**
 * Mid-cycle overage settlement kicks in once a user's unbilled overage
 * reaches this many dollars, rather than waiting for the period-end cron -
 * the whole point is to avoid a surprise end-of-month bill for a heavy
 * usage spike. $100 is a deliberately conservative default; pass
 * thresholdOverride to tune it per call site/test.
 */
export const DEFAULT_THRESHOLD = 100

export class ThresholdSettlementError extends Error {
  retryable: boolean
  cause?: unknown

  constructor(message: string, retryable: boolean, cause?: unknown) {
    super(message)
    this.name = 'ThresholdSettlementError'
    this.retryable = retryable
    this.cause = cause
  }
}

export interface ThresholdSettlementResult {
  settled: boolean
  unbilledOverage: number
  creditsApplied: number
  chargedAmount: number
  paymentLinkId?: string
}

interface ThresholdClaim {
  unbilledOverage: number
  creditsApplied: number
  remainingAmount: number
  billingPeriodKey: string
}

/**
 * Checks whether a user's unbilled overage has crossed the threshold and,
 * if so, settles it: applies available credit first, then bills the
 * remainder to Stripe. USER-LEVEL ONLY - if the user's active subscription
 * is organization-referenced (a team/enterprise member), this is a no-op;
 * organization-level threshold billing is deliberately deferred, orgs keep
 * the existing daily/period-end cadence (see processOrganizationOverageBilling).
 *
 * The "claim" (deduct credits + mark the overage as billed) happens in a
 * single row-locked transaction against userStats, so concurrent poll ticks
 * can't double-count or double-deduct credits for the same user. Issuing the
 * Razorpay payment link happens AFTER that transaction commits, deliberately
 * outside the lock - holding a Postgres transaction open across a slow
 * external network call is the same mistake avoided in
 * lib/billing/webhooks/idempotency.ts. If issuing the payment link fails,
 * the claim is compensated (credits refunded, billed amount reverted) and a
 * retryable ThresholdSettlementError is thrown so the next poll tick retries.
 */
export async function checkAndSettleThresholdForUser(
  userId: string,
  thresholdOverride?: number
): Promise<ThresholdSettlementResult> {
  const threshold = thresholdOverride ?? DEFAULT_THRESHOLD

  const activeSubscription = await getHighestPrioritySubscription(userId)
  if (
    !activeSubscription ||
    activeSubscription.referenceId !== userId ||
    activeSubscription.plan === 'free'
  ) {
    return { settled: false, unbilledOverage: 0, creditsApplied: 0, chargedAmount: 0 }
  }

  const plan = activeSubscription.plan
  const { basePrice: planBasePrice } = getPlanPricing(plan, activeSubscription)

  const claim = await db.transaction(async (tx): Promise<ThresholdClaim | null> => {
    const rows = await tx
      .select({
        currentPeriodCost: userStats.currentPeriodCost,
        billedOverageThisPeriod: userStats.billedOverageThisPeriod,
        creditBalance: userStats.creditBalance,
      })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .for('update')
      .limit(1)

    if (rows.length === 0) {
      throw new ThresholdSettlementError(`No userStats row for user ${userId}`, false)
    }

    const currentPeriodCost = Number.parseFloat(rows[0].currentPeriodCost?.toString() || '0')
    const billedOverageThisPeriod = Number.parseFloat(
      rows[0].billedOverageThisPeriod?.toString() || '0'
    )
    const creditBalance = Number.parseFloat(rows[0].creditBalance?.toString() || '0')

    const unbilledOverage =
      Math.round(Math.max(0, currentPeriodCost - planBasePrice - billedOverageThisPeriod) * 100) /
      100

    if (unbilledOverage < threshold) {
      return null
    }

    const creditsApplied = Math.round(Math.min(creditBalance, unbilledOverage) * 100) / 100
    const remainingAmount = Math.round((unbilledOverage - creditsApplied) * 100) / 100
    const newCreditBalance = Math.round((creditBalance - creditsApplied) * 100) / 100
    const newBilledOverage = Math.round((billedOverageThisPeriod + unbilledOverage) * 100) / 100

    await tx
      .update(userStats)
      .set({
        creditBalance: newCreditBalance.toString(),
        billedOverageThisPeriod: newBilledOverage.toString(),
      })
      .where(eq(userStats.userId, userId))

    if (creditsApplied > 0) {
      await tx.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId,
        amount: (-creditsApplied).toString(),
        type: 'applied_to_charge' satisfies CreditTransactionType,
        description: `Threshold settlement (mid-cycle overage, ${plan} plan)`,
        balanceAfter: newCreditBalance.toString(),
      })
    }

    // The PRE-claim billedOverageThisPeriod value uniquely identifies this
    // crossing (it strictly increases with each settlement), so it stays
    // stable for concurrent retries of the same crossing while differing
    // from the next one - used as the Stripe idempotency key stem below.
    return {
      unbilledOverage,
      creditsApplied,
      remainingAmount,
      billingPeriodKey: billedOverageThisPeriod.toString(),
    }
  })

  if (!claim) {
    return { settled: false, unbilledOverage: 0, creditsApplied: 0, chargedAmount: 0 }
  }

  if (claim.remainingAmount <= 0) {
    logger.info('Settled threshold overage entirely with credits', {
      userId,
      unbilledOverage: claim.unbilledOverage,
      creditsApplied: claim.creditsApplied,
    })
    return {
      settled: true,
      unbilledOverage: claim.unbilledOverage,
      creditsApplied: claim.creditsApplied,
      chargedAmount: 0,
    }
  }

  const userRecord = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!userRecord[0]?.email) {
    await compensateFailedClaim(userId, claim, plan)
    throw new ThresholdSettlementError(`No email on file for user ${userId}`, false)
  }

  const description = `Mid-cycle usage overage settlement for ${plan} plan - ₹${claim.remainingAmount.toFixed(2)} (threshold: ₹${threshold})`
  const notes = {
    zelaxyUserId: userId,
    zelaxyPlan: plan,
    zelaxyThresholdSettlement: 'true',
    zelaxyUnbilledOverage: claim.unbilledOverage.toString(),
    zelaxyCreditsApplied: claim.creditsApplied.toString(),
    zelaxyBillingPeriod: new Date().toISOString().slice(0, 7),
  }
  const referenceId = `threshold-${userId}-${claim.billingPeriodKey}`

  let result: Awaited<ReturnType<typeof createOverageBillingPaymentLink>>
  try {
    result = await createOverageBillingPaymentLink(
      userRecord[0].name || 'Zelaxy user',
      userRecord[0].email,
      claim.remainingAmount,
      description,
      notes,
      referenceId
    )
  } catch (error) {
    await compensateFailedClaim(userId, claim, plan)
    throw new ThresholdSettlementError(
      `Issuing the overage payment link failed during threshold settlement for user ${userId}`,
      true,
      error
    )
  }

  if (!result.success) {
    await compensateFailedClaim(userId, claim, plan)
    throw new ThresholdSettlementError(
      `Issuing the overage payment link failed during threshold settlement for user ${userId}: ${result.error}`,
      true
    )
  }

  logger.info('Settled threshold overage', {
    userId,
    unbilledOverage: claim.unbilledOverage,
    creditsApplied: claim.creditsApplied,
    chargedAmount: claim.remainingAmount,
    paymentLinkId: result.paymentLinkId,
  })

  return {
    settled: true,
    unbilledOverage: claim.unbilledOverage,
    creditsApplied: claim.creditsApplied,
    chargedAmount: claim.remainingAmount,
    paymentLinkId: result.paymentLinkId,
  }
}

/**
 * Reverts a claim (refunds deducted credits, un-marks the overage as
 * billed) when issuing the payment link that was supposed to follow it
 * fails - otherwise the overage would be silently lost (marked billed with
 * nothing actually charged) instead of retried on the next poll tick.
 */
async function compensateFailedClaim(
  userId: string,
  claim: ThresholdClaim,
  plan: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({
          creditBalance: userStats.creditBalance,
          billedOverageThisPeriod: userStats.billedOverageThisPeriod,
        })
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .for('update')
        .limit(1)

      if (rows.length === 0) return

      const creditBalance = Number.parseFloat(rows[0].creditBalance?.toString() || '0')
      const billedOverageThisPeriod = Number.parseFloat(
        rows[0].billedOverageThisPeriod?.toString() || '0'
      )

      const restoredCreditBalance = Math.round((creditBalance + claim.creditsApplied) * 100) / 100
      const restoredBilledOverage =
        Math.round((billedOverageThisPeriod - claim.unbilledOverage) * 100) / 100

      await tx
        .update(userStats)
        .set({
          creditBalance: restoredCreditBalance.toString(),
          billedOverageThisPeriod: restoredBilledOverage.toString(),
        })
        .where(eq(userStats.userId, userId))

      if (claim.creditsApplied > 0) {
        await tx.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId,
          amount: claim.creditsApplied.toString(),
          type: 'admin_adjustment' satisfies CreditTransactionType,
          description: `Threshold settlement failed for ${plan} plan - credits refunded`,
          balanceAfter: restoredCreditBalance.toString(),
        })
      }
    })
  } catch (error) {
    logger.error('Failed to compensate a failed threshold settlement claim', {
      userId,
      claim,
      error,
    })
  }
}

/**
 * Individual (non-organization) users with an active paid subscription -
 * the candidate pool for a threshold billing poll tick. Mirrors
 * lib/billing/credits/refresh.ts's getActivePaidUsersForCreditRefresh: same
 * "credits/threshold billing are user-level only" scoping, so
 * organization-referenced (team/enterprise) subscriptions are excluded here
 * too.
 */
async function getActiveIndividualPaidUserIds(): Promise<string[]> {
  const activeSubscriptions = await db
    .select({ referenceId: subscription.referenceId, plan: subscription.plan })
    .from(subscription)
    .where(eq(subscription.status, 'active'))

  const candidateIds = activeSubscriptions
    .filter((sub) => !!sub.plan && sub.plan !== 'free')
    .map((sub) => sub.referenceId)
  if (candidateIds.length === 0) return []

  const userRows = await db.select({ id: user.id }).from(user).where(inArray(user.id, candidateIds))
  const validUserIds = new Set(userRows.map((row) => row.id))

  return candidateIds.filter((id) => validUserIds.has(id))
}

export interface ThresholdBillingCheckSummary {
  success: boolean
  candidateCount: number
  settledCount: number
  totalCharged: number
  totalCreditsApplied: number
  errors: string[]
}

/**
 * Poll entry point (see app/api/billing/threshold/route.ts): checks every
 * active individual paid user for a threshold crossing and settles it if
 * so. Intentionally NOT invoked from the synchronous per-execution hot path
 * (lib/logs/execution/logger.ts) - checking every user on every single
 * execution would add latency/risk to the hottest code path in the product
 * for a feature (avoiding a surprise end-of-month bill) that doesn't need
 * real-time precision. A frequent poll (production: every ~20 minutes, see
 * vercel.json) is an intentional, documented trade-off of a few minutes of
 * settlement lag for zero impact on execution latency.
 */
export async function processThresholdBillingCheck(
  thresholdOverride?: number
): Promise<ThresholdBillingCheckSummary> {
  try {
    const userIds = await getActiveIndividualPaidUserIds()

    let settledCount = 0
    let totalCharged = 0
    let totalCreditsApplied = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        const result = await checkAndSettleThresholdForUser(userId, thresholdOverride)
        if (result.settled) {
          settledCount++
          totalCharged = Math.round((totalCharged + result.chargedAmount) * 100) / 100
          totalCreditsApplied =
            Math.round((totalCreditsApplied + result.creditsApplied) * 100) / 100
        }
      } catch (error) {
        const message = `User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(message)
        logger.error('Exception during threshold billing check', { userId, error })
      }
    }

    logger.info('Completed threshold billing check', {
      candidateCount: userIds.length,
      settledCount,
      totalCharged,
      totalCreditsApplied,
      errorCount: errors.length,
    })

    return {
      success: errors.length === 0,
      candidateCount: userIds.length,
      settledCount,
      totalCharged,
      totalCreditsApplied,
      errors,
    }
  } catch (error) {
    logger.error('Fatal error during threshold billing check', { error })
    return {
      success: false,
      candidateCount: 0,
      settledCount: 0,
      totalCharged: 0,
      totalCreditsApplied: 0,
      errors: [error instanceof Error ? error.message : 'Fatal threshold billing check error'],
    }
  }
}
