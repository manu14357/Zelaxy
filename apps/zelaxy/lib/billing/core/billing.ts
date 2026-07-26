import { and, eq, sql } from 'drizzle-orm'
import { DEFAULT_FREE_CREDITS, getPlanMinimumCost } from '@/lib/billing/constants'
import {
  resetOrganizationBillingPeriod,
  resetUserBillingPeriod,
} from '@/lib/billing/core/billing-periods'
import { getHighestPrioritySubscription } from '@/lib/billing/core/subscription'
import { getUserUsageData } from '@/lib/billing/core/usage'
import { adjustCreditBalance, deductAvailableCredits } from '@/lib/billing/credits/balance'
import { createOverageBillingPaymentLink } from '@/lib/billing/razorpay/payment-links'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { member, organization, subscription, user, userStats } from '@/db/schema'

const logger = createLogger('Billing')

interface BillingResult {
  success: boolean
  chargedAmount?: number
  paymentLinkId?: string
  error?: string
}

/**
 * BILLING MODEL:
 * 1. User purchases ₹1,999 Pro plan → Gets charged immediately via a
 *    Razorpay subscription mandate.
 * 2. User uses less than their usage-metering budget during the month → No
 *    additional charge.
 * 3. User uses more than their budget during the month → Gets sent a
 *    Razorpay Payment Link for the overage at month end (or mid-cycle, see
 *    lib/billing/threshold-billing.ts).
 * 4. Usage resets, next month they pay again + any overages.
 *
 * The usage-metering budget (getPlanPricing/getPlanMinimumCost below) is a
 * SEPARATE numeric domain from what Razorpay actually charges the customer
 * (see lib/billing/razorpay-pricing.ts) - it tracks real AI-provider spend
 * and is unrelated to the subscription price.
 */

/**
 * Get plan pricing information
 */
export function getPlanPricing(
  plan: string,
  subscription?: any
): {
  basePrice: number // Usage-metering budget included in this plan
  minimum: number // Minimum they're guaranteed to get before overage
} {
  switch (plan) {
    case 'free':
      return { basePrice: 0, minimum: 0 } // Free plan has no charges
    case 'pro':
      return { basePrice: getPlanMinimumCost('pro'), minimum: getPlanMinimumCost('pro') }
    case 'team':
      // Per-seat budget
      return { basePrice: getPlanMinimumCost('team'), minimum: getPlanMinimumCost('team') }
    case 'enterprise': {
      // Get per-seat pricing from metadata
      const defaultEnterprisePrice = getPlanMinimumCost('enterprise')
      if (subscription?.metadata) {
        const metadata =
          typeof subscription.metadata === 'string'
            ? JSON.parse(subscription.metadata)
            : subscription.metadata

        // Validate perSeatAllowance is a positive number
        const perSeatAllowance = metadata.perSeatAllowance
        const perSeatPrice =
          typeof perSeatAllowance === 'number' && perSeatAllowance > 0
            ? perSeatAllowance
            : defaultEnterprisePrice // Fall back to default for invalid values

        return { basePrice: perSeatPrice, minimum: perSeatPrice }
      }
      return { basePrice: defaultEnterprisePrice, minimum: defaultEnterprisePrice } // Default enterprise pricing
    }
    default:
      return { basePrice: 0, minimum: 0 }
  }
}

export type RazorpayCustomerAccount =
  | { type: 'user'; userId: string }
  | { type: 'organization'; organizationId: string; memberUserIds: string[] }

/**
 * Reverse of getRazorpayCustomerId: given a Razorpay customer id (as seen on
 * a payment/subscription webhook payload), find which user or organization
 * it belongs to. Fallback path for webhook handlers - `notes.zelaxyReferenceId`
 * (stamped on every order/subscription/payment link we create) is the
 * primary resolution mechanism and doesn't need this lookup at all.
 */
export async function findAccountByRazorpayCustomerId(
  customerId: string
): Promise<RazorpayCustomerAccount | null> {
  const userRecord = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.razorpayCustomerId, customerId))
    .limit(1)

  if (userRecord.length > 0) {
    return { type: 'user', userId: userRecord[0].id }
  }

  // Organizations store their Razorpay customer id inside a JSON metadata
  // blob rather than a dedicated indexed column, so this scans all orgs.
  // Webhook volume is low and this only runs on payment events, not a hot path.
  const orgRecords = await db
    .select({ id: organization.id, metadata: organization.metadata })
    .from(organization)

  for (const org of orgRecords) {
    if (!org.metadata) continue
    const metadata = typeof org.metadata === 'string' ? JSON.parse(org.metadata) : org.metadata
    if (metadata?.razorpayCustomerId === customerId) {
      const members = await db
        .select({ userId: member.userId })
        .from(member)
        .where(eq(member.organizationId, org.id))
      return {
        type: 'organization',
        organizationId: org.id,
        memberUserIds: members.map((m) => m.userId),
      }
    }
  }

  return null
}

/**
 * Zeroes out an organization's departedMemberUsage accumulator once it has
 * been folded into a billed (or correctly no-op) overage cycle. Defined here
 * rather than in organization-billing.ts to avoid a circular import
 * (organization-billing.ts already imports getPlanPricing from this file).
 */
async function resetDepartedMemberUsage(organizationId: string): Promise<void> {
  await db
    .update(organization)
    .set({ departedMemberUsage: '0' })
    .where(eq(organization.id, organizationId))
}

/**
 * Get Razorpay customer ID for a user or organization, if one has been
 * recorded (set once a subscription successfully authorizes and we learn
 * its customer_id - see the checkout verify route). Not required for
 * overage billing (Payment Links take the customer's name/email inline, no
 * pre-existing customer needed) - this is informational/reused-across-
 * purchases only.
 */
export async function getRazorpayCustomerId(referenceId: string): Promise<string | null> {
  try {
    const userRecord = await db
      .select({ razorpayCustomerId: user.razorpayCustomerId })
      .from(user)
      .where(eq(user.id, referenceId))
      .limit(1)

    if (userRecord.length > 0 && userRecord[0].razorpayCustomerId) {
      return userRecord[0].razorpayCustomerId
    }

    const orgRecord = await db
      .select({ metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, referenceId))
      .limit(1)

    if (orgRecord.length > 0 && orgRecord[0].metadata) {
      const metadata =
        typeof orgRecord[0].metadata === 'string'
          ? JSON.parse(orgRecord[0].metadata)
          : orgRecord[0].metadata

      if (metadata?.razorpayCustomerId) {
        return metadata.razorpayCustomerId
      }
    }

    return null
  } catch (error) {
    logger.error('Failed to get Razorpay customer ID', { referenceId, error })
    return null
  }
}

/**
 * Calculate overage billing for a user
 * Returns only the amount that exceeds their subscription base price
 */
export async function calculateUserOverage(userId: string): Promise<{
  basePrice: number
  actualUsage: number
  overageAmount: number
  plan: string
} | null> {
  try {
    // Get user's subscription and usage data
    const [subscription, usageData, userRecord] = await Promise.all([
      getHighestPrioritySubscription(userId),
      getUserUsageData(userId),
      db.select().from(user).where(eq(user.id, userId)).limit(1),
    ])

    if (userRecord.length === 0) {
      logger.warn('User not found for overage calculation', { userId })
      return null
    }

    const plan = subscription?.plan || 'free'
    const { basePrice } = getPlanPricing(plan, subscription)
    const actualUsage = usageData.currentUsage

    // Calculate overage: any usage beyond what they already paid for
    const overageAmount = Math.max(0, actualUsage - basePrice)

    return {
      basePrice,
      actualUsage,
      overageAmount,
      plan,
    }
  } catch (error) {
    logger.error('Failed to calculate user overage', { userId, error })
    return null
  }
}

/**
 * Process overage billing for an individual user
 */
export async function processUserOverageBilling(userId: string): Promise<BillingResult> {
  try {
    const overageInfo = await calculateUserOverage(userId)

    if (!overageInfo) {
      return { success: false, error: 'Failed to calculate overage information' }
    }

    // Skip billing for free plan users
    if (overageInfo.plan === 'free') {
      logger.info('Skipping overage billing for free plan user', { userId })
      return { success: true, chargedAmount: 0 }
    }

    // Skip if no overage
    if (overageInfo.overageAmount <= 0) {
      logger.info('No overage to bill for user', {
        userId,
        basePrice: overageInfo.basePrice,
        actualUsage: overageInfo.actualUsage,
      })

      // Still reset billing period even if no overage
      try {
        await resetUserBillingPeriod(userId)
      } catch (resetError) {
        logger.error('Failed to reset billing period', { userId, error: resetError })
      }

      return { success: true, chargedAmount: 0 }
    }

    // Subtract whatever a mid-cycle threshold settlement already billed this
    // period (see lib/billing/threshold-billing.ts) - overageAmount is the
    // FULL period overage, not just what's still unbilled.
    const statsRow = await db
      .select({ billedOverageThisPeriod: userStats.billedOverageThisPeriod })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1)
    const billedOverageThisPeriod = Number.parseFloat(
      statsRow[0]?.billedOverageThisPeriod?.toString() || '0'
    )
    const unbilledOverage =
      Math.round(Math.max(0, overageInfo.overageAmount - billedOverageThisPeriod) * 100) / 100

    if (unbilledOverage <= 0) {
      logger.info('Overage already fully billed via threshold settlement this period', {
        userId,
        overageAmount: overageInfo.overageAmount,
        billedOverageThisPeriod,
      })

      try {
        await resetUserBillingPeriod(userId)
      } catch (resetError) {
        logger.error('Failed to reset billing period', { userId, error: resetError })
      }

      return { success: true, chargedAmount: 0 }
    }

    // Apply available prepaid credit before issuing a payment link.
    const { creditsApplied, remainingAmount } = await deductAvailableCredits(
      userId,
      unbilledOverage,
      { description: `Applied to ${overageInfo.plan} plan overage (period-end billing)` }
    )

    if (remainingAmount <= 0) {
      logger.info('Overage fully covered by credits, no payment link needed', {
        userId,
        unbilledOverage,
        creditsApplied,
      })

      try {
        await db
          .update(userStats)
          .set({
            billedOverageThisPeriod: sql`${userStats.billedOverageThisPeriod} + ${unbilledOverage}`,
          })
          .where(eq(userStats.userId, userId))
        await resetUserBillingPeriod(userId)
      } catch (resetError) {
        logger.error('Failed to reset billing period', { userId, error: resetError })
      }

      return { success: true, chargedAmount: 0 }
    }

    const userRecord = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!userRecord[0]?.email) {
      logger.error('No email on file for user, cannot issue an overage payment link', { userId })
      await refundCreditsForFailedOverageCharge(userId, creditsApplied, overageInfo.plan)
      return { success: false, error: 'No email on file for user' }
    }

    const description = `Usage overage for ${overageInfo.plan} plan - ₹${remainingAmount.toFixed(2)} above ₹${overageInfo.basePrice} base${creditsApplied > 0 ? ` (after ₹${creditsApplied.toFixed(2)} credits applied)` : ''}`
    const notes = {
      zelaxyUserId: userId,
      zelaxyPlan: overageInfo.plan,
      zelaxyBasePrice: overageInfo.basePrice.toString(),
      zelaxyActualUsage: overageInfo.actualUsage.toString(),
      zelaxyOverageAmount: overageInfo.overageAmount.toString(),
      zelaxyCreditsApplied: creditsApplied.toString(),
      zelaxyBillingPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM format
    }
    const referenceId = `overage-${userId}-${notes.zelaxyBillingPeriod}-${billedOverageThisPeriod}`

    let result: BillingResult
    try {
      const linkResult = await createOverageBillingPaymentLink(
        userRecord[0].name || 'Zelaxy user',
        userRecord[0].email,
        remainingAmount,
        description,
        notes,
        referenceId
      )
      result = linkResult
    } catch (error) {
      await refundCreditsForFailedOverageCharge(userId, creditsApplied, overageInfo.plan)
      throw error
    }

    if (!result.success) {
      await refundCreditsForFailedOverageCharge(userId, creditsApplied, overageInfo.plan)
      return result
    }

    // Billing succeeded (credits + payment link issued): mark the full
    // unbilled overage as billed and reset the period. Incrementing
    // billedOverageThisPeriod first (rather than relying solely on the reset
    // below) means that if resetUserBillingPeriod's own update fails, the
    // next run still won't re-derive and re-bill the same overage from scratch.
    try {
      await db
        .update(userStats)
        .set({
          billedOverageThisPeriod: sql`${userStats.billedOverageThisPeriod} + ${unbilledOverage}`,
        })
        .where(eq(userStats.userId, userId))
      await resetUserBillingPeriod(userId)
      logger.info('Successfully reset billing period after billing user overage', { userId })
    } catch (resetError) {
      logger.error('Failed to reset billing period after successful overage charge', {
        userId,
        error: resetError,
      })
    }

    return result
  } catch (error) {
    logger.error('Failed to process user overage billing', { userId, error })
    return { success: false, error: 'Failed to process overage billing' }
  }
}

/**
 * Refunds credits deducted in anticipation of a payment link that then
 * failed to send (missing email, or createOverageBillingPaymentLink
 * erroring/reporting failure) - otherwise the credits would be silently
 * lost even though no charge actually went through. Best-effort: logs and
 * swallows its own failure rather than throwing, since the caller is
 * already on a failure path and a refund error shouldn't mask the original one.
 */
async function refundCreditsForFailedOverageCharge(
  userId: string,
  creditsApplied: number,
  plan: string
): Promise<void> {
  if (creditsApplied <= 0) return
  try {
    await adjustCreditBalance(userId, creditsApplied, 'admin_adjustment', {
      description: `Overage billing failed for ${plan} plan - credits refunded`,
    })
  } catch (error) {
    logger.error('Failed to refund credits after a failed overage charge', {
      userId,
      creditsApplied,
      error,
    })
  }
}

/**
 * Process overage billing for an organization (team/enterprise plans)
 *
 * Deliberately does NOT apply prepaid credits here (unlike
 * processUserOverageBilling) - userStats.creditBalance is scoped to a single
 * user, and an organization's aggregate overage charge has no single natural
 * owner to deduct from (which member's balance? split how?). Extending
 * credits to teams needs its own design decision this pass doesn't make;
 * organization members keep the existing payment-link-only billing path.
 */
export async function processOrganizationOverageBilling(
  organizationId: string
): Promise<BillingResult> {
  try {
    // Get organization subscription
    const subscription = await getHighestPrioritySubscription(organizationId)

    if (!subscription || !['team', 'enterprise'].includes(subscription.plan)) {
      logger.warn('No team/enterprise subscription found for organization', { organizationId })
      return { success: false, error: 'No valid subscription found' }
    }

    // Get organization owner's name/email to send the overage payment link to
    const orgOwner = await db
      .select({
        userId: member.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(eq(member.organizationId, organizationId), eq(member.role, 'owner')))
      .limit(1)

    if (!orgOwner[0]?.userEmail) {
      logger.error(
        'No owner email on file for organization, cannot issue an overage payment link',
        {
          organizationId,
        }
      )
      return { success: false, error: 'No owner email on file for organization' }
    }

    // Get all organization members
    const members = await db
      .select({
        userId: member.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId))

    // Usage from members who left mid-period — would otherwise be silently
    // dropped from the org's overage total the moment they're removed.
    const orgRecord = await db
      .select({ departedMemberUsage: organization.departedMemberUsage })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1)
    const departedMemberUsage = Number.parseFloat(
      orgRecord[0]?.departedMemberUsage?.toString() || '0'
    )

    if (members.length === 0 && departedMemberUsage <= 0) {
      logger.info('No members or departed usage found for organization overage billing', {
        organizationId,
      })
      return { success: true, chargedAmount: 0 }
    }

    // Calculate total team usage across all members
    const { basePrice: basePricePerSeat } = getPlanPricing(subscription.plan, subscription)
    const licensedSeats = subscription.seats || 1
    const baseSubscriptionAmount = licensedSeats * basePricePerSeat // What was already paid via the subscription

    let totalTeamUsage = departedMemberUsage
    const memberUsageDetails = []

    for (const memberInfo of members) {
      const usageData = await getUserUsageData(memberInfo.userId)
      totalTeamUsage += usageData.currentUsage

      memberUsageDetails.push({
        userId: memberInfo.userId,
        name: memberInfo.userName,
        email: memberInfo.userEmail,
        usage: usageData.currentUsage,
      })
    }

    // Calculate team-level overage: total usage beyond what was already paid for
    const totalOverage = Math.max(0, totalTeamUsage - baseSubscriptionAmount)

    // Skip if no overage across the organization
    if (totalOverage <= 0) {
      logger.info('No overage to bill for organization', {
        organizationId,
        licensedSeats,
        memberCount: members.length,
        totalTeamUsage,
        departedMemberUsage,
        baseSubscriptionAmount,
      })

      // Still reset billing period for all members
      try {
        await resetOrganizationBillingPeriod(organizationId)
        await resetDepartedMemberUsage(organizationId)
      } catch (resetError) {
        logger.error('Failed to reset organization billing period', {
          organizationId,
          error: resetError,
        })
      }

      return { success: true, chargedAmount: 0 }
    }

    // Create a consolidated overage payment link for the organization
    const description = `Team usage overage for ${subscription.plan} plan - ${licensedSeats} licensed seats, ₹${totalTeamUsage.toFixed(2)} total usage (incl. ₹${departedMemberUsage.toFixed(2)} from departed members), ₹${totalOverage.toFixed(2)} overage`
    const billingPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const notes = {
      zelaxyOrganizationId: organizationId,
      zelaxyPlan: subscription.plan,
      zelaxyLicensedSeats: licensedSeats.toString(),
      zelaxyMemberCount: members.length.toString(),
      zelaxyTotalTeamUsage: totalTeamUsage.toString(),
      zelaxyDepartedMemberUsage: departedMemberUsage.toString(),
      zelaxyTotalOverage: totalOverage.toString(),
      zelaxyBillingPeriod: billingPeriod,
    }
    const referenceId = `overage-org-${organizationId}-${billingPeriod}`

    const result = await createOverageBillingPaymentLink(
      orgOwner[0].userName || 'Zelaxy team owner',
      orgOwner[0].userEmail,
      totalOverage,
      description,
      notes,
      referenceId
    )

    // If billing was successful, reset billing period for all organization members
    if (result.success) {
      try {
        await resetOrganizationBillingPeriod(organizationId)
        await resetDepartedMemberUsage(organizationId)
        logger.info('Successfully reset billing period for organization after overage billing', {
          organizationId,
          memberCount: members.length,
        })
      } catch (resetError) {
        logger.error(
          'Failed to reset organization billing period after successful overage charge',
          {
            organizationId,
            error: resetError,
          }
        )
      }
    }

    logger.info('Processed organization overage billing', {
      organizationId,
      memberCount: members.length,
      totalOverage,
      result,
    })

    return result
  } catch (error) {
    logger.error('Failed to process organization overage billing', { organizationId, error })
    return { success: false, error: 'Failed to process organization overage billing' }
  }
}

/**
 * Get users and organizations whose billing periods end today
 */
export async function getUsersAndOrganizationsForOverageBilling(): Promise<{
  users: string[]
  organizations: string[]
}> {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0) // Start of today
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1) // Start of tomorrow

    logger.info('Checking for subscriptions with billing periods ending today', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
    })

    // Get all active subscriptions (excluding free plans)
    const activeSubscriptions = await db
      .select()
      .from(subscription)
      .where(eq(subscription.status, 'active'))

    const users: string[] = []
    const organizations: string[] = []

    for (const sub of activeSubscriptions) {
      if (sub.plan === 'free') {
        continue // Skip free plans
      }

      // Check if subscription period ends today
      let shouldBillToday = false

      if (sub.periodEnd) {
        const periodEnd = new Date(sub.periodEnd)
        periodEnd.setUTCHours(0, 0, 0, 0) // Normalize to start of day

        // Bill if the subscription period ends today
        if (periodEnd.getTime() === today.getTime()) {
          shouldBillToday = true
          logger.info('Subscription period ends today', {
            referenceId: sub.referenceId,
            plan: sub.plan,
            periodEnd: sub.periodEnd,
          })
        }
      } else {
        // Fallback: Check userStats billing period for users
        const userStatsRecord = await db
          .select({
            billingPeriodEnd: userStats.billingPeriodEnd,
          })
          .from(userStats)
          .where(eq(userStats.userId, sub.referenceId))
          .limit(1)

        if (userStatsRecord.length > 0 && userStatsRecord[0].billingPeriodEnd) {
          const billingPeriodEnd = new Date(userStatsRecord[0].billingPeriodEnd)
          billingPeriodEnd.setUTCHours(0, 0, 0, 0) // Normalize to start of day

          if (billingPeriodEnd.getTime() === today.getTime()) {
            shouldBillToday = true
            logger.info('User billing period ends today (from userStats)', {
              userId: sub.referenceId,
              plan: sub.plan,
              billingPeriodEnd: userStatsRecord[0].billingPeriodEnd,
            })
          }
        }
      }

      if (shouldBillToday) {
        // Check if referenceId is a user or organization
        const userExists = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, sub.referenceId))
          .limit(1)

        if (userExists.length > 0) {
          // It's a user subscription (pro plan)
          users.push(sub.referenceId)
        } else {
          // Check if it's an organization
          const orgExists = await db
            .select({ id: organization.id })
            .from(organization)
            .where(eq(organization.id, sub.referenceId))
            .limit(1)

          if (orgExists.length > 0) {
            // It's an organization subscription (team/enterprise)
            organizations.push(sub.referenceId)
          }
        }
      }
    }

    logger.info('Found entities for daily billing check', {
      userCount: users.length,
      organizationCount: organizations.length,
      users,
      organizations,
    })

    return { users, organizations }
  } catch (error) {
    logger.error('Failed to get entities for daily billing check', { error })
    return { users: [], organizations: [] }
  }
}

/**
 * Get comprehensive billing and subscription summary
 */
export async function getSimplifiedBillingSummary(
  userId: string,
  organizationId?: string
): Promise<{
  type: 'individual' | 'organization'
  plan: string
  basePrice: number
  currentUsage: number
  overageAmount: number
  totalProjected: number
  usageLimit: number
  percentUsed: number
  isWarning: boolean
  isExceeded: boolean
  daysRemaining: number
  // Subscription details
  isPaid: boolean
  isPro: boolean
  isTeam: boolean
  isEnterprise: boolean
  status: string | null
  seats: number | null
  metadata: any
  razorpaySubscriptionId: string | null
  periodEnd: Date | string | null
  // Usage details
  usage: {
    current: number
    limit: number
    percentUsed: number
    isWarning: boolean
    isExceeded: boolean
    billingPeriodStart: Date | null
    billingPeriodEnd: Date | null
    lastPeriodCost: number
    daysRemaining: number
  }
  organizationData?: {
    seatCount: number
    totalBasePrice: number
    totalCurrentUsage: number
    totalOverage: number
  }
}> {
  try {
    // Get subscription and usage data upfront
    const [subscription, usageData] = await Promise.all([
      getHighestPrioritySubscription(organizationId || userId),
      getUserUsageData(userId),
    ])

    // Determine subscription type flags
    const plan = subscription?.plan || 'free'
    const isPaid = plan !== 'free'
    const isPro = plan === 'pro'
    const isTeam = plan === 'team'
    const isEnterprise = plan === 'enterprise'

    if (organizationId) {
      // Organization billing summary
      if (!subscription) {
        return getDefaultBillingSummary('organization')
      }

      // Get all organization members
      const members = await db
        .select({ userId: member.userId })
        .from(member)
        .where(eq(member.organizationId, organizationId))

      const { basePrice: basePricePerSeat } = getPlanPricing(subscription.plan, subscription)
      const licensedSeats = subscription.seats || 1
      const totalBasePrice = basePricePerSeat * licensedSeats // Based on licensed seats, not member count

      let totalCurrentUsage = 0

      // Calculate total team usage across all members
      for (const memberInfo of members) {
        const memberUsageData = await getUserUsageData(memberInfo.userId)
        totalCurrentUsage += memberUsageData.currentUsage
      }

      // Calculate team-level overage: total usage beyond what was already paid for
      const totalOverage = Math.max(0, totalCurrentUsage - totalBasePrice)

      // Get user's personal limits for warnings
      const percentUsed =
        usageData.limit > 0 ? Math.round((usageData.currentUsage / usageData.limit) * 100) : 0

      // Calculate days remaining in billing period
      const daysRemaining = usageData.billingPeriodEnd
        ? Math.max(
            0,
            Math.ceil((usageData.billingPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          )
        : 0

      return {
        type: 'organization',
        plan: subscription.plan,
        basePrice: totalBasePrice,
        currentUsage: totalCurrentUsage,
        overageAmount: totalOverage,
        totalProjected: totalBasePrice + totalOverage,
        usageLimit: usageData.limit,
        percentUsed,
        isWarning: percentUsed >= 80 && percentUsed < 100,
        isExceeded: usageData.currentUsage >= usageData.limit,
        daysRemaining,
        // Subscription details
        isPaid,
        isPro,
        isTeam,
        isEnterprise,
        status: subscription.status || null,
        seats: subscription.seats || null,
        metadata: subscription.metadata || null,
        razorpaySubscriptionId: subscription.razorpaySubscriptionId || null,
        periodEnd: subscription.periodEnd || null,
        // Usage details
        usage: {
          current: usageData.currentUsage,
          limit: usageData.limit,
          percentUsed,
          isWarning: percentUsed >= 80 && percentUsed < 100,
          isExceeded: usageData.currentUsage >= usageData.limit,
          billingPeriodStart: usageData.billingPeriodStart,
          billingPeriodEnd: usageData.billingPeriodEnd,
          lastPeriodCost: usageData.lastPeriodCost,
          daysRemaining,
        },
        organizationData: {
          seatCount: licensedSeats,
          totalBasePrice,
          totalCurrentUsage,
          totalOverage,
        },
      }
    }

    // Individual billing summary
    const { basePrice } = getPlanPricing(plan, subscription)
    const overageAmount = Math.max(0, usageData.currentUsage - basePrice)
    const percentUsed =
      usageData.limit > 0 ? Math.round((usageData.currentUsage / usageData.limit) * 100) : 0

    // Calculate days remaining in billing period
    const daysRemaining = usageData.billingPeriodEnd
      ? Math.max(
          0,
          Math.ceil((usageData.billingPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )
      : 0

    return {
      type: 'individual',
      plan,
      basePrice,
      currentUsage: usageData.currentUsage,
      overageAmount,
      totalProjected: basePrice + overageAmount,
      usageLimit: usageData.limit,
      percentUsed,
      isWarning: percentUsed >= 80 && percentUsed < 100,
      isExceeded: usageData.currentUsage >= usageData.limit,
      daysRemaining,
      // Subscription details
      isPaid,
      isPro,
      isTeam,
      isEnterprise,
      status: subscription?.status || null,
      seats: subscription?.seats || null,
      metadata: subscription?.metadata || null,
      razorpaySubscriptionId: subscription?.razorpaySubscriptionId || null,
      periodEnd: subscription?.periodEnd || null,
      // Usage details
      usage: {
        current: usageData.currentUsage,
        limit: usageData.limit,
        percentUsed,
        isWarning: percentUsed >= 80 && percentUsed < 100,
        isExceeded: usageData.currentUsage >= usageData.limit,
        billingPeriodStart: usageData.billingPeriodStart,
        billingPeriodEnd: usageData.billingPeriodEnd,
        lastPeriodCost: usageData.lastPeriodCost,
        daysRemaining,
      },
    }
  } catch (error) {
    logger.error('Failed to get simplified billing summary', { userId, organizationId, error })
    return getDefaultBillingSummary(organizationId ? 'organization' : 'individual')
  }
}

/**
 * Get default billing summary for error cases
 */
function getDefaultBillingSummary(type: 'individual' | 'organization') {
  return {
    type,
    plan: 'free',
    basePrice: 0,
    currentUsage: 0,
    overageAmount: 0,
    totalProjected: 0,
    usageLimit: DEFAULT_FREE_CREDITS,
    percentUsed: 0,
    isWarning: false,
    isExceeded: false,
    daysRemaining: 0,
    // Subscription details
    isPaid: false,
    isPro: false,
    isTeam: false,
    isEnterprise: false,
    status: null,
    seats: null,
    metadata: null,
    razorpaySubscriptionId: null,
    periodEnd: null,
    // Usage details
    usage: {
      current: 0,
      limit: DEFAULT_FREE_CREDITS,
      percentUsed: 0,
      isWarning: false,
      isExceeded: false,
      billingPeriodStart: null,
      billingPeriodEnd: null,
      lastPeriodCost: 0,
      daysRemaining: 0,
    },
  }
}

/**
 * Process daily billing check for users and organizations with periods ending today
 */
export async function processDailyBillingCheck(): Promise<{
  success: boolean
  processedUsers: number
  processedOrganizations: number
  totalChargedAmount: number
  errors: string[]
}> {
  try {
    logger.info('Starting daily billing check process')

    const { users, organizations } = await getUsersAndOrganizationsForOverageBilling()

    let processedUsers = 0
    let processedOrganizations = 0
    let totalChargedAmount = 0
    const errors: string[] = []

    // Process individual users (pro plans)
    for (const userId of users) {
      try {
        const result = await processUserOverageBilling(userId)
        if (result.success) {
          processedUsers++
          totalChargedAmount += result.chargedAmount || 0
          logger.info('Successfully processed user overage billing', {
            userId,
            chargedAmount: result.chargedAmount,
          })
        } else {
          errors.push(`User ${userId}: ${result.error}`)
          logger.error('Failed to process user overage billing', { userId, error: result.error })
        }
      } catch (error) {
        const errorMsg = `User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        logger.error('Exception during user overage billing', { userId, error })
      }
    }

    // Process organizations (team/enterprise plans)
    for (const organizationId of organizations) {
      try {
        const result = await processOrganizationOverageBilling(organizationId)
        if (result.success) {
          processedOrganizations++
          totalChargedAmount += result.chargedAmount || 0
          logger.info('Successfully processed organization overage billing', {
            organizationId,
            chargedAmount: result.chargedAmount,
          })
        } else {
          errors.push(`Organization ${organizationId}: ${result.error}`)
          logger.error('Failed to process organization overage billing', {
            organizationId,
            error: result.error,
          })
        }
      } catch (error) {
        const errorMsg = `Organization ${organizationId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        logger.error('Exception during organization overage billing', { organizationId, error })
      }
    }

    logger.info('Completed daily billing check process', {
      processedUsers,
      processedOrganizations,
      totalChargedAmount,
      errorCount: errors.length,
    })

    return {
      success: errors.length === 0,
      processedUsers,
      processedOrganizations,
      totalChargedAmount,
      errors,
    }
  } catch (error) {
    logger.error('Fatal error during daily billing check process', { error })
    return {
      success: false,
      processedUsers: 0,
      processedOrganizations: 0,
      totalChargedAmount: 0,
      errors: [error instanceof Error ? error.message : 'Fatal daily billing check process error'],
    }
  }
}

/**
 * Legacy function for backward compatibility - now redirects to daily billing check
 * @deprecated Use processDailyBillingCheck instead
 */
export async function processMonthlyOverageBilling(): Promise<{
  success: boolean
  processedUsers: number
  processedOrganizations: number
  totalChargedAmount: number
  errors: string[]
}> {
  logger.warn('processMonthlyOverageBilling is deprecated, use processDailyBillingCheck instead')
  return processDailyBillingCheck()
}
