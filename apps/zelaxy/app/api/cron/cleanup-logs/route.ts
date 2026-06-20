import { inArray, lt } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflowExecutionLogs } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('CleanupLogsAPI')

// Execution logs older than this are purged. Override with LOG_RETENTION_DAYS.
const DEFAULT_RETENTION_DAYS = 30
const BATCH_SIZE = 1000
const MAX_BATCHES = 100 // safety cap per run (≤100k rows); the next cron run continues

/**
 * GET /api/cron/cleanup-logs
 *
 * Deletes workflow execution logs older than the retention window. Runs on a schedule (cron) and is
 * authenticated with the cron secret. Batched so a single invocation stays bounded.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request, 'cleanup logs')
  if (authError) return authError

  const retentionDays = Number.parseInt(
    process.env.LOG_RETENTION_DAYS || String(DEFAULT_RETENTION_DAYS),
    10
  )
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  let totalDeleted = 0
  let batches = 0

  try {
    while (batches < MAX_BATCHES) {
      const rows = await db
        .select({ id: workflowExecutionLogs.id })
        .from(workflowExecutionLogs)
        .where(lt(workflowExecutionLogs.startedAt, cutoff))
        .limit(BATCH_SIZE)

      if (rows.length === 0) break

      const ids = rows.map((r) => r.id)
      await db.delete(workflowExecutionLogs).where(inArray(workflowExecutionLogs.id, ids))
      totalDeleted += ids.length
      batches++
      if (rows.length < BATCH_SIZE) break
    }

    logger.info('Cleanup-logs complete', { totalDeleted, retentionDays, batches })
    return NextResponse.json({ success: true, deleted: totalDeleted, retentionDays })
  } catch (error: any) {
    logger.error('Cleanup-logs failed', { error: error?.message, totalDeleted })
    return NextResponse.json(
      { success: false, error: error?.message || 'Cleanup failed', deleted: totalDeleted },
      { status: 500 }
    )
  }
}
