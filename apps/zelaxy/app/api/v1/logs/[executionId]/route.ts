import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflow, workflowExecutionLogs } from '@/db/schema'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1LogDetailAPI')

export const revalidate = 0

/** GET /api/v1/logs/[executionId] — Get a single execution log by executionId. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ executionId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { executionId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'logs-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    const [log] = await db
      .select()
      .from(workflowExecutionLogs)
      .where(eq(workflowExecutionLogs.executionId, executionId))
      .limit(1)

    if (!log) {
      return NextResponse.json({ error: 'Execution log not found' }, { status: 404 })
    }

    // Resolve the workflow to check workspace access
    const [wf] = await db
      .select({ workspaceId: workflow.workspaceId, userId: workflow.userId })
      .from(workflow)
      .where(eq(workflow.id, log.workflowId))
      .limit(1)

    if (!wf) {
      return NextResponse.json({ error: 'Execution log not found' }, { status: 404 })
    }

    if (wf.workspaceId) {
      const accessError = await validateWorkspaceAccess(rateLimit, userId, wf.workspaceId)
      if (accessError) {
        return NextResponse.json({ error: 'Execution log not found' }, { status: 404 })
      }
    } else if (wf.userId !== userId) {
      return NextResponse.json({ error: 'Execution log not found' }, { status: 404 })
    }

    logger.info(`[${requestId}] Fetched execution log ${executionId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: log.id,
        workflowId: log.workflowId,
        executionId: log.executionId,
        level: log.level,
        message: log.message,
        trigger: log.trigger,
        startedAt: log.startedAt.toISOString(),
        endedAt: log.endedAt?.toISOString() ?? null,
        totalDurationMs: log.totalDurationMs,
        blockCount: log.blockCount,
        successCount: log.successCount,
        errorCount: log.errorCount,
        skippedCount: log.skippedCount,
        totalCost: log.totalCost ? Number(log.totalCost) : null,
        totalInputCost: log.totalInputCost ? Number(log.totalInputCost) : null,
        totalOutputCost: log.totalOutputCost ? Number(log.totalOutputCost) : null,
        totalTokens: log.totalTokens,
        metadata: log.metadata,
        files: log.files,
        createdAt: log.createdAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching execution log`, { error })
    return NextResponse.json({ error: 'Failed to fetch execution log' }, { status: 500 })
  }
}
