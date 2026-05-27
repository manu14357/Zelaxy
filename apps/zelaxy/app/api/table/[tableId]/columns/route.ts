import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import { addColumn, deleteColumn, updateColumn } from '@/lib/table'
import type { ColumnDefinition } from '@/lib/table'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableColumnsAPI')

const AddColumnBody = z.object({
  column: z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['string', 'number', 'boolean', 'date', 'json']),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
  }),
})

const UpdateColumnBody = z.object({
  columnName: z.string(),
  updates: z.object({
    name: z.string().optional(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'json']).optional(),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
  }),
})

const DeleteColumnBody = z.object({
  columnName: z.string(),
})

function serializeTable(t: { id: string; name: string; description: string | null; schema: unknown; metadata: unknown; rowCount: number; maxRows: number; workspaceId: string; createdBy: string | null; archivedAt: Date | string | null; createdAt: Date | string; updatedAt: Date | string }) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    schema: t.schema,
    metadata: t.metadata,
    rowCount: t.rowCount,
    maxRows: t.maxRows,
    workspaceId: t.workspaceId,
    createdBy: t.createdBy,
    archivedAt: t.archivedAt instanceof Date ? t.archivedAt.toISOString() : t.archivedAt,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
  }
}

/** POST /api/table/[tableId]/columns — add a column */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tableId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'write')
    if (!access.ok) return accessError(access, requestId, tableId)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = AddColumnBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const table = await addColumn(tableId, parsed.data.column as ColumnDefinition, requestId)
    return NextResponse.json({ success: true, data: { table: serializeTable(table) } })
  } catch (error) {
    logger.error(`[${requestId}] Error adding column to table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to add column' }, { status: 500 })
  }
}

/** PATCH /api/table/[tableId]/columns — update a column */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tableId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'write')
    if (!access.ok) return accessError(access, requestId, tableId)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = UpdateColumnBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const table = await updateColumn(tableId, parsed.data.columnName, parsed.data.updates, requestId)
    return NextResponse.json({ success: true, data: { table: serializeTable(table) } })
  } catch (error) {
    logger.error(`[${requestId}] Error updating column in table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to update column' }, { status: 500 })
  }
}

/** DELETE /api/table/[tableId]/columns — delete a column */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tableId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'write')
    if (!access.ok) return accessError(access, requestId, tableId)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = DeleteColumnBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'columnName required' }, { status: 400 })
    }

    const table = await deleteColumn(tableId, parsed.data.columnName, requestId)
    return NextResponse.json({ success: true, data: { table: serializeTable(table) } })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting column from table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to delete column' }, { status: 500 })
  }
}
