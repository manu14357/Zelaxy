import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflow, workflowExecutionLogs } from '@/db/schema'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1LogsAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const QuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  workflowIds: z.string().optional(),
  level: z.enum(['info', 'error']).optional(),
  trigger: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

/** GET /api/v1/logs — List execution logs for a workspace. */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'logs')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!
    const { searchParams } = new URL(request.url)
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { workspaceId, workflowIds: rawWorkflowIds, level, trigger, startDate, endDate, limit, offset } =
      parsed.data

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId)
    if (accessError) return accessError

    // Resolve workflow IDs in this workspace
    let workflowIdFilter: string[]
    if (rawWorkflowIds) {
      workflowIdFilter = rawWorkflowIds.split(',').map((id) => id.trim()).filter(Boolean)
    } else {
      const wfs = await db
        .select({ id: workflow.id })
        .from(workflow)
        .where(eq(workflow.workspaceId, workspaceId))
      workflowIdFilter = wfs.map((w) => w.id)
    }

    if (workflowIdFilter.length === 0) {
      return NextResponse.json({
        success: true,
        data: { logs: [], totalCount: 0, limit, offset },
      })
    }

    const conditions = [inArray(workflowExecutionLogs.workflowId, workflowIdFilter)]
    if (level) conditions.push(eq(workflowExecutionLogs.level, level))
    if (trigger) conditions.push(eq(workflowExecutionLogs.trigger, trigger))
    if (startDate) conditions.push(gte(workflowExecutionLogs.startedAt, new Date(startDate)))
    if (endDate) conditions.push(lte(workflowExecutionLogs.startedAt, new Date(endDate)))

    const rows = await db
      .select({
        id: workflowExecutionLogs.id,
        workflowId: workflowExecutionLogs.workflowId,
        executionId: workflowExecutionLogs.executionId,
        level: workflowExecutionLogs.level,
        message: workflowExecutionLogs.message,
        trigger: workflowExecutionLogs.trigger,
        startedAt: workflowExecutionLogs.startedAt,
        endedAt: workflowExecutionLogs.endedAt,
        totalDurationMs: workflowExecutionLogs.totalDurationMs,
        blockCount: workflowExecutionLogs.blockCount,
        successCount: workflowExecutionLogs.successCount,
        errorCount: workflowExecutionLogs.errorCount,
        skippedCount: workflowExecutionLogs.skippedCount,
        totalCost: workflowExecutionLogs.totalCost,
        totalTokens: workflowExecutionLogs.totalTokens,
        createdAt: workflowExecutionLogs.createdAt,
      })
      .from(workflowExecutionLogs)
      .where(and(...conditions))
      .orderBy(desc(workflowExecutionLogs.startedAt))
      .limit(limit)
      .offset(offset)

    logger.info(`[${requestId}] Listed ${rows.length} execution logs for workspace ${workspaceId}`)

    return NextResponse.json({
      success: true,
      data: {
        logs: rows.map((log) => ({
          ...log,
          startedAt: log.startedAt.toISOString(),
          endedAt: log.endedAt?.toISOString() ?? null,
          createdAt: log.createdAt.toISOString(),
          totalCost: log.totalCost ? Number(log.totalCost) : null,
        })),
        totalCount: rows.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing execution logs`, { error })
    return NextResponse.json({ error: 'Failed to list execution logs' }, { status: 500 })
  }
}
