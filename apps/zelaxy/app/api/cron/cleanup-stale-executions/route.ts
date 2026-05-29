import { and, eq, lt, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflowExecutionLogs } from '@/db/schema'

export const dynamic = 'force-dynamic'

const logger = createLogger('CleanupStaleExecutionsAPI')

// Executions stuck in 'running' state for more than 2 hours are considered stale
const STALE_THRESHOLD_HOURS = 2
const BATCH_SIZE = 500

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'cleanup stale executions')
    if (authError) return authError

    const staleThreshold = new Date()
    staleThreshold.setHours(staleThreshold.getHours() - STALE_THRESHOLD_HOURS)

    // Find and update stale running executions in batches
    let totalUpdated = 0
    let batchCount = 0

    while (true) {
      const staleExecutions = await db
        .select({ id: workflowExecutionLogs.id })
        .from(workflowExecutionLogs)
        .where(
          and(
            eq(workflowExecutionLogs.level, 'info'),
            sql`${workflowExecutionLogs.endedAt} IS NULL`,
            lt(workflowExecutionLogs.startedAt, staleThreshold)
          )
        )
        .limit(BATCH_SIZE)

      if (staleExecutions.length === 0) break

      const ids = staleExecutions.map((e) => e.id)
      const now = new Date()

      await db
        .update(workflowExecutionLogs)
        .set({
          endedAt: now,
          level: 'error',
          message: 'Execution terminated: stale execution cleanup',
        })
        .where(
          and(
            sql`${workflowExecutionLogs.id} = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(',')}]::text[]`)})`,
            sql`${workflowExecutionLogs.endedAt} IS NULL`
          )
        )

      totalUpdated += staleExecutions.length
      batchCount++

      if (staleExecutions.length < BATCH_SIZE) break
    }

    logger.info(`Cleaned up ${totalUpdated} stale executions in ${batchCount} batches`)

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${totalUpdated} stale executions`,
      totalUpdated,
      batchCount,
    })
  } catch (error) {
    logger.error('Error cleaning up stale executions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clean up stale executions' },
      { status: 500 }
    )
  }
}
