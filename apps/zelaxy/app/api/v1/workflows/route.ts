import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'
import { db } from '@/db'
import { workflow } from '@/db/schema'

const logger = createLogger('V1WorkflowsAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const QuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  deployedOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

/** GET /api/v1/workflows — List workflows in a workspace. */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'workflows')
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

    const { workspaceId, deployedOnly, limit, offset } = parsed.data

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId)
    if (accessError) return accessError

    const conditions = [eq(workflow.workspaceId, workspaceId)]
    if (deployedOnly) {
      conditions.push(eq(workflow.isDeployed, true))
    }

    const rows = await db
      .select({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        color: workflow.color,
        folderId: workflow.folderId,
        workspaceId: workflow.workspaceId,
        isDeployed: workflow.isDeployed,
        deployedAt: workflow.deployedAt,
        runCount: workflow.runCount,
        lastRunAt: workflow.lastRunAt,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      })
      .from(workflow)
      .where(and(...conditions))
      .orderBy(desc(workflow.updatedAt))
      .limit(limit)
      .offset(offset)

    logger.info(`[${requestId}] Listed ${rows.length} workflows for workspace ${workspaceId}`)

    return NextResponse.json({
      success: true,
      data: {
        workflows: rows.map((w) => ({
          ...w,
          deployedAt: w.deployedAt?.toISOString() ?? null,
          lastRunAt: w.lastRunAt?.toISOString() ?? null,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
        })),
        totalCount: rows.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing workflows`, { error })
    return NextResponse.json({ error: 'Failed to list workflows' }, { status: 500 })
  }
}
