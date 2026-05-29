import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import {
  deleteTable,
  getTableById,
  renameTable,
  updateTableMetadata,
  TableConflictError,
  type TableSchema,
} from '@/lib/table'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import {
  checkRateLimit,
  createRateLimitResponse,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1TableDetailAPI')

export const revalidate = 0

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
})

/** GET /api/v1/tables/[tableId] — Get a table's definition. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tableId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'table-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!
    const table = await getTableById(tableId)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const permission = await getUserEntityPermissions(userId, 'workspace', table.workspaceId)
    if (permission === null) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    logger.info(`[${requestId}] Fetched table ${tableId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: table.id,
        name: table.name,
        description: table.description,
        schema: table.schema,
        metadata: table.metadata,
        rowCount: table.rowCount,
        maxRows: table.maxRows,
        workspaceId: table.workspaceId,
        archivedAt: table.archivedAt ? new Date(table.archivedAt).toISOString() : null,
        createdAt: new Date(table.createdAt).toISOString(),
        updatedAt: new Date(table.updatedAt).toISOString(),
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching table`, { error })
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 })
  }
}

/** PATCH /api/v1/tables/[tableId] — Rename or update table metadata. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tableId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'table-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const table = await getTableById(tableId)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const permission = await getUserEntityPermissions(userId, 'workspace', table.workspaceId)
    if (permission === null || permission === 'read') {
      return NextResponse.json({ error: 'Write access required' }, { status: 403 })
    }

    const { name, metadata } = parsed.data

    if (name) {
      await renameTable(tableId, name, requestId)
    }

    if (metadata) {
      await updateTableMetadata(tableId, metadata as Parameters<typeof updateTableMetadata>[1], requestId)
    }

    const updated = await getTableById(tableId)

    logger.info(`[${requestId}] Updated table ${tableId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: updated!.id,
        name: updated!.name,
        description: updated!.description,
        schema: updated!.schema,
        metadata: updated!.metadata,
        rowCount: updated!.rowCount,
        maxRows: updated!.maxRows,
        workspaceId: updated!.workspaceId,
        createdAt: new Date(updated!.createdAt).toISOString(),
        updatedAt: new Date(updated!.updatedAt).toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof TableConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    logger.error(`[${requestId}] Error updating table`, { error })
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

/** DELETE /api/v1/tables/[tableId] — Archive a table. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tableId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'table-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    const table = await getTableById(tableId)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const permission = await getUserEntityPermissions(userId, 'workspace', table.workspaceId)
    if (permission === null || permission === 'read') {
      return NextResponse.json({ error: 'Write access required' }, { status: 403 })
    }

    await deleteTable(tableId, requestId)

    logger.info(`[${requestId}] Archived table ${tableId}`)

    return NextResponse.json({ success: true, data: { id: tableId, archived: true } })
  } catch (error) {
    logger.error(`[${requestId}] Error archiving table`, { error })
    return NextResponse.json({ error: 'Failed to archive table' }, { status: 500 })
  }
}
