import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { workflow, workflowBlocks } from '@/db/schema'

const logger = createLogger('SubblocksAPI')

export const dynamic = 'force-dynamic'

const SubblockUpdateSchema = z.object({
  blockId: z.string().min(1),
  subblockId: z.string().min(1),
  value: z.any(),
})

/**
 * PATCH /api/workflows/[id]/subblocks
 * HTTP fallback for updating a single subblock value.
 * Used when the socket connection is unavailable.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id: workflowId } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const body = await request.json()
    const parseResult = SubblockUpdateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { blockId, subblockId, value } = parseResult.data

    // Verify workflow exists and the user has access
    const [workflowData] = await db
      .select({ userId: workflow.userId, workspaceId: workflow.workspaceId })
      .from(workflow)
      .where(eq(workflow.id, workflowId))
      .limit(1)

    if (!workflowData) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    let canUpdate = workflowData.userId === userId

    if (!canUpdate && workflowData.workspaceId) {
      const permission = await getUserEntityPermissions(
        userId,
        'workspace',
        workflowData.workspaceId
      )
      canUpdate = permission === 'write' || permission === 'admin'
    }

    if (!canUpdate) {
      logger.warn(`[${requestId}] User ${userId} denied access to workflow ${workflowId}`)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the subblock value in the database (same logic as socket server handler)
    let updated = false
    await db.transaction(async (tx) => {
      const [block] = await tx
        .select({ subBlocks: workflowBlocks.subBlocks })
        .from(workflowBlocks)
        .where(and(eq(workflowBlocks.id, blockId), eq(workflowBlocks.workflowId, workflowId)))
        .limit(1)

      if (!block) {
        return // Block not found — treat as no-op
      }

      const subBlocks = (block.subBlocks as any) || {}

      if (!subBlocks[subblockId]) {
        subBlocks[subblockId] = { id: subblockId, type: 'unknown', value }
      } else {
        subBlocks[subblockId] = { ...subBlocks[subblockId], value }
      }

      await tx
        .update(workflowBlocks)
        .set({ subBlocks, updatedAt: new Date() })
        .where(and(eq(workflowBlocks.id, blockId), eq(workflowBlocks.workflowId, workflowId)))

      updated = true
    })

    if (!updated) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    logger.debug(`[${requestId}] HTTP subblock update: ${workflowId}/${blockId}.${subblockId}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error(`[${requestId}] Error updating subblock:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
