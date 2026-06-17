import crypto from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { workflow, workflowSchedule } from '@/db/schema'

const logger = createLogger('SchedulesListAPI')

export const dynamic = 'force-dynamic'

/**
 * List all schedules for a workspace.
 *
 * Unlike the per-workflow GET on /api/schedules, this returns every schedule
 * attached to a workflow in the given workspace so the Schedules dashboard can
 * show them in one place. Requires the user to have any permission on the
 * workspace.
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 })
    }

    const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
    if (permission === null) {
      return NextResponse.json({ error: 'Not authorized to view this workspace' }, { status: 403 })
    }

    const rows = await db
      .select({
        schedule: workflowSchedule,
        workflowId: workflow.id,
        workflowName: workflow.name,
      })
      .from(workflowSchedule)
      .innerJoin(workflow, eq(workflowSchedule.workflowId, workflow.id))
      .where(eq(workflow.workspaceId, workspaceId))
      .orderBy(desc(workflowSchedule.nextRunAt))

    const schedules = rows.map((row) => ({
      id: row.schedule.id,
      workflowId: row.workflowId,
      workflowName: row.workflowName,
      blockId: row.schedule.blockId,
      cronExpression: row.schedule.cronExpression,
      nextRunAt: row.schedule.nextRunAt,
      lastRanAt: row.schedule.lastRanAt,
      lastFailedAt: row.schedule.lastFailedAt,
      status: row.schedule.status,
      failedCount: row.schedule.failedCount,
      timezone: row.schedule.timezone,
      triggerType: row.schedule.triggerType,
      createdAt: row.schedule.createdAt,
      updatedAt: row.schedule.updatedAt,
    }))

    return NextResponse.json({ schedules })
  } catch (error) {
    logger.error(`[${requestId}] Error listing workspace schedules`, error)
    return NextResponse.json({ error: 'Failed to list schedules' }, { status: 500 })
  }
}
