import { and, eq, lt } from 'drizzle-orm'
import { sendUsageAlertEmail } from '@/lib/billing/emails'
import { isBillingEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { notification, subscription as subscriptionTable, userStats } from '@/db/schema'

const logger = createLogger('UsageAlerts')

// Usage-% buckets that trigger an alert (email + in-app notification), once per
// bucket per billing period.
export const USAGE_ALERT_BUCKETS = [50, 75, 80, 90, 100] as const

/** The highest alert bucket the given usage percentage has crossed, or 0. */
export function highestUsageBucket(percentUsed: number): number {
  let bucket = 0
  for (const t of USAGE_ALERT_BUCKETS) {
    if (percentUsed >= t) bucket = t
  }
  return bucket
}

/**
 * Fires usage-threshold alerts (email + in-app notification) as a user's
 * current-period cost crosses 50/75/80/90/100% of their plan limit. Called
 * best-effort from the metering path after each execution's cost is recorded.
 *
 * Idempotent per period: `userStats.alertedUsageThreshold` records the highest
 * bucket already alerted this period. currentPeriodCost only increases within a
 * period, so a single monotonic integer suffices. The alert is claimed with an
 * atomic conditional UPDATE (`... WHERE alerted_usage_threshold < bucket`), so
 * across concurrent executions exactly one caller wins and alerts once; a jump
 * past several buckets lands on the highest and alerts once. The flag resets to
 * 0 on billing-period reset/init (lib/billing/core/billing-periods.ts).
 */
export async function checkUsageAlerts(userId: string): Promise<void> {
  if (!isBillingEnabled) return
  try {
    const [stats] = await db
      .select({
        currentPeriodCost: userStats.currentPeriodCost,
        currentUsageLimit: userStats.currentUsageLimit,
        alertedUsageThreshold: userStats.alertedUsageThreshold,
      })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1)
    if (!stats) return

    const limit = Number.parseFloat(stats.currentUsageLimit?.toString() || '0')
    if (!(limit > 0)) return
    const used = Number.parseFloat(stats.currentPeriodCost?.toString() || '0')
    const percentUsed = (used / limit) * 100

    const bucket = highestUsageBucket(percentUsed)
    if (bucket === 0 || bucket <= (stats.alertedUsageThreshold ?? 0)) return

    // Atomic claim - only the caller that transitions the flag past this bucket
    // fires the alert, and only if no higher bucket was already alerted.
    const claim = await db
      .update(userStats)
      .set({ alertedUsageThreshold: bucket })
      .where(and(eq(userStats.userId, userId), lt(userStats.alertedUsageThreshold, bucket)))
      .returning({ id: userStats.id })
    if (claim.length === 0) return

    await dispatchUsageAlert(userId, bucket, used, limit)
  } catch (error) {
    logger.error('Failed to check usage alerts', { userId, error })
  }
}

async function resolvePlanLabel(userId: string): Promise<string> {
  try {
    const [sub] = await db
      .select({ plan: subscriptionTable.plan })
      .from(subscriptionTable)
      .where(and(eq(subscriptionTable.referenceId, userId), eq(subscriptionTable.status, 'active')))
      .limit(1)
    const plan = sub?.plan || 'free'
    return plan.charAt(0).toUpperCase() + plan.slice(1)
  } catch {
    return 'Free'
  }
}

async function dispatchUsageAlert(
  userId: string,
  bucket: number,
  used: number,
  limit: number
): Promise<void> {
  const planLabel = await resolvePlanLabel(userId)

  const title = bucket >= 100 ? 'Usage limit reached' : `You've used ${bucket}% of your plan`
  const message =
    bucket >= 100
      ? `You've used all of your included ${planLabel} usage this billing period. Further usage is billed as overage.`
      : `You've used ${bucket}% of your included ${planLabel} usage this billing period.`

  // In-app notification (persistent).
  try {
    await db.insert(notification).values({
      id: crypto.randomUUID(),
      userId,
      type: 'usage_alert',
      title,
      message,
      level: bucket >= 90 ? 'error' : bucket >= 75 ? 'warning' : 'info',
      metadata: { bucket, used, limit },
    })
  } catch (error) {
    logger.error('Failed to write usage-alert notification', { userId, bucket, error })
  }

  // Email (best-effort).
  await sendUsageAlertEmail(userId, { planLabel, percent: bucket, used, limit })

  logger.info('Dispatched usage alert', { userId, bucket, planLabel })
}
