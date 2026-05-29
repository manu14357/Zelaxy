import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflow } from '@/db/schema'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1WorkflowDetailAPI')

export const revalidate = 0

/** GET /api/v1/workflows/[workflowId] — Get workflow details. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { workflowId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'workflow-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    const [wf] = await db
      .select({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        color: workflow.color,
        folderId: workflow.folderId,
        workspaceId: workflow.workspaceId,
        userId: workflow.userId,
        isDeployed: workflow.isDeployed,
        deployedAt: workflow.deployedAt,
        runCount: workflow.runCount,
        lastRunAt: workflow.lastRunAt,
        variables: workflow.variables,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      })
      .from(workflow)
      .where(eq(workflow.id, workflowId))
      .limit(1)

    if (!wf) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Verify workspace access (or direct ownership for personal workflows)
    if (wf.workspaceId) {
      const accessError = await validateWorkspaceAccess(rateLimit, userId, wf.workspaceId)
      if (accessError) {
        // Return 404 to avoid leaking existence
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
    } else if (wf.userId !== userId) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    logger.info(`[${requestId}] Fetched workflow ${workflowId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: wf.id,
        name: wf.name,
        description: wf.description,
        color: wf.color,
        folderId: wf.folderId,
        workspaceId: wf.workspaceId,
        isDeployed: wf.isDeployed,
        deployedAt: wf.deployedAt?.toISOString() ?? null,
        runCount: wf.runCount,
        lastRunAt: wf.lastRunAt?.toISOString() ?? null,
        variables: wf.variables ?? {},
        createdAt: wf.createdAt.toISOString(),
        updatedAt: wf.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching workflow`, { error })
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}
