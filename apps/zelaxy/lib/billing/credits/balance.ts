import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { creditTransactions, userStats } from '@/db/schema'

const logger = createLogger('CreditBalance')

export type CreditTransactionType =
  | 'purchase'
  | 'daily_refresh'
  | 'applied_to_charge'
  | 'admin_adjustment'

export async function getCreditBalance(userId: string): Promise<number> {
  const rows = await db
    .select({ creditBalance: userStats.creditBalance })
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1)

  return Number.parseFloat(rows[0]?.creditBalance?.toString() || '0')
}

/**
 * Adds (positive) or removes (negative amount) credits, row-locked so
 * concurrent adjustments for the same user (a purchase landing at the same
 * moment as a charge being applied) can't race and produce a wrong balance.
 * Records every change in creditTransactions for audit purposes. Throws if
 * the resulting balance would go negative — callers that need to charge
 * "up to whatever's available" should use deductAvailableCredits instead.
 */
export async function adjustCreditBalance(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options: { description?: string; relatedInvoiceId?: string } = {}
): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ creditBalance: userStats.creditBalance })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .for('update')
      .limit(1)

    if (rows.length === 0) {
      throw new Error(`No userStats row for user ${userId} - cannot adjust credit balance`)
    }

    const currentBalance = Number.parseFloat(rows[0].creditBalance?.toString() || '0')
    const newBalance = Math.round((currentBalance + amount) * 100) / 100

    if (newBalance < 0) {
      throw new Error(
        `Credit adjustment would make balance negative for user ${userId} (current: ${currentBalance}, delta: ${amount})`
      )
    }

    await tx
      .update(userStats)
      .set({ creditBalance: newBalance.toString() })
      .where(eq(userStats.userId, userId))

    await tx.insert(creditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: amount.toString(),
      type,
      description: options.description ?? null,
      relatedInvoiceId: options.relatedInvoiceId ?? null,
      balanceAfter: newBalance.toString(),
    })

    logger.info('Adjusted credit balance', { userId, amount, type, newBalance })

    return newBalance
  })
}

export interface DeductAvailableCreditsResult {
  /** How much of the requested amount was actually covered by credits */
  creditsApplied: number
  /** What's left to charge (via a Razorpay payment link) after credits */
  remainingAmount: number
  newBalance: number
}

/**
 * Applies up to `amount` dollars of the user's available credit balance
 * against a charge, deducting only what's available (never goes negative,
 * never throws for insufficient balance — that's the whole point: use
 * whatever credit exists, charge the rest via a Razorpay payment link).
 */
export async function deductAvailableCredits(
  userId: string,
  amount: number,
  options: { description?: string; relatedInvoiceId?: string } = {}
): Promise<DeductAvailableCreditsResult> {
  if (amount <= 0) {
    const balance = await getCreditBalance(userId)
    return { creditsApplied: 0, remainingAmount: 0, newBalance: balance }
  }

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ creditBalance: userStats.creditBalance })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .for('update')
      .limit(1)

    const currentBalance =
      rows.length > 0 ? Number.parseFloat(rows[0].creditBalance?.toString() || '0') : 0

    if (currentBalance <= 0) {
      return { creditsApplied: 0, remainingAmount: amount, newBalance: currentBalance }
    }

    const creditsApplied = Math.round(Math.min(currentBalance, amount) * 100) / 100
    const newBalance = Math.round((currentBalance - creditsApplied) * 100) / 100
    const remainingAmount = Math.round((amount - creditsApplied) * 100) / 100

    await tx
      .update(userStats)
      .set({ creditBalance: newBalance.toString() })
      .where(eq(userStats.userId, userId))

    await tx.insert(creditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: (-creditsApplied).toString(),
      type: 'applied_to_charge' satisfies CreditTransactionType,
      description: options.description ?? null,
      relatedInvoiceId: options.relatedInvoiceId ?? null,
      balanceAfter: newBalance.toString(),
    })

    logger.info('Applied credits to charge', {
      userId,
      requestedAmount: amount,
      creditsApplied,
      remainingAmount,
      newBalance,
    })

    return { creditsApplied, remainingAmount, newBalance }
  })
}
