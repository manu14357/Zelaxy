import { eq, inArray } from 'drizzle-orm'
import { getPlanMinimumCost } from '@/lib/billing/constants'
import type { CreditTransactionType } from '@/lib/billing/credits/balance'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { creditTransactions, subscription, user, userStats } from '@/db/schema'

const logger = createLogger('CreditRefresh')

// Daily top-up is 1% of the plan's minimum monthly cost, capped so the
// balance never exceeds that minimum - see refreshUserCredits() for the
// full rationale.
const DAILY_REFRESH_RATE = 0.01

interface RefreshCandidate {
  userId: string
  plan: string
}

async function getActivePaidUsersForCreditRefresh(): Promise<RefreshCandidate[]> {
  const activeSubscriptions = await db
    .select({ referenceId: subscription.referenceId, plan: subscription.plan })
    .from(subscription)
    .where(eq(subscription.status, 'active'))

  const candidates = activeSubscriptions.filter(
    (sub): sub is { referenceId: string; plan: string } => !!sub.plan && sub.plan !== 'free'
  )
  if (candidates.length === 0) return []

  // Credits are user-level only (userStats.creditBalance / creditTransactions
  // are keyed by user, not organization) - filter to subscriptions actually
  // referenced by a user id. Organization-referenced (team/enterprise)
  // subscriptions are skipped; org-level credit refresh is out of scope for
  // this pass.
  const userRows = await db
    .select({ id: user.id })
    .from(user)
    .where(
      inArray(
        user.id,
        candidates.map((c) => c.referenceId)
      )
    )
  const validUserIds = new Set(userRows.map((row) => row.id))

  return candidates
    .filter((c) => validUserIds.has(c.referenceId))
    .map((c) => ({ userId: c.referenceId, plan: c.plan }))
}

/**
 * Tops up a single user's prepaid credit balance by 1% of their plan's
 * minimum monthly cost, capped so the balance never exceeds that minimum.
 * This is a deliberately bounded interpretation of "daily auto-refresh": it
 * keeps a small rolling cushion topped up for active subscribers without
 * ever functioning as a way to accumulate unlimited free credit. Row-locked
 * so a refresh can't race a concurrent purchase/deduction into a wrong
 * balance.
 */
async function refreshUserCredits(userId: string, plan: string): Promise<number> {
  const planMinimum = getPlanMinimumCost(plan)
  if (planMinimum <= 0) return 0

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ creditBalance: userStats.creditBalance })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .for('update')
      .limit(1)

    if (rows.length === 0) return 0

    const currentBalance = Number.parseFloat(rows[0].creditBalance?.toString() || '0')
    if (currentBalance >= planMinimum) return 0

    const dailyAmount = Math.round(planMinimum * DAILY_REFRESH_RATE * 100) / 100
    const amountToAdd = Math.min(dailyAmount, planMinimum - currentBalance)
    if (amountToAdd <= 0) return 0

    const newBalance = Math.round((currentBalance + amountToAdd) * 100) / 100

    await tx
      .update(userStats)
      .set({ creditBalance: newBalance.toString() })
      .where(eq(userStats.userId, userId))

    await tx.insert(creditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: amountToAdd.toString(),
      type: 'daily_refresh' satisfies CreditTransactionType,
      description: `Daily credit refresh (1% of ${plan} plan minimum)`,
      balanceAfter: newBalance.toString(),
    })

    return amountToAdd
  })
}

export interface CreditRefreshResult {
  success: boolean
  processedUsers: number
  totalRefreshed: number
  errors: string[]
}

export async function processDailyCreditRefresh(): Promise<CreditRefreshResult> {
  try {
    const candidates = await getActivePaidUsersForCreditRefresh()

    let processedUsers = 0
    let totalRefreshed = 0
    const errors: string[] = []

    for (const { userId, plan } of candidates) {
      try {
        const amountAdded = await refreshUserCredits(userId, plan)
        if (amountAdded > 0) {
          processedUsers++
          totalRefreshed = Math.round((totalRefreshed + amountAdded) * 100) / 100
        }
      } catch (error) {
        const message = `User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(message)
        logger.error('Exception during daily credit refresh', { userId, error })
      }
    }

    logger.info('Completed daily credit refresh', {
      candidateCount: candidates.length,
      processedUsers,
      totalRefreshed,
      errorCount: errors.length,
    })

    return { success: errors.length === 0, processedUsers, totalRefreshed, errors }
  } catch (error) {
    logger.error('Fatal error during daily credit refresh', { error })
    return {
      success: false,
      processedUsers: 0,
      totalRefreshed: 0,
      errors: [error instanceof Error ? error.message : 'Fatal daily credit refresh error'],
    }
  }
}
