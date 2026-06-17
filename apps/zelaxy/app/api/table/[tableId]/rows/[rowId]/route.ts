import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import type { RowData } from '@/lib/table'
import { deleteRow, getRowById, updateRow } from '@/lib/table'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableRowAPI')

const UpdateRowBody = z.object({
  data: z.record(z.unknown()),
})

function serializeRow(r: {
  id: string
  data: RowData
  position: number
  createdAt: Date | string
  updatedAt: Date | string
}) {
  return {
    id: r.id,
    data: r.data,
    position: r.position,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  }
}

/** GET /api/table/[tableId]/rows/[rowId] — get a single row */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tableId: string; rowId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId, rowId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'read')
    if (!access.ok) return accessError(access, requestId, tableId)

    const row = await getRowById(tableId, rowId)
    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { row: serializeRow(row) } })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching row ${rowId}:`, error)
    return NextResponse.json({ error: 'Failed to get row' }, { status: 500 })
  }
}

/** PATCH /api/table/[tableId]/rows/[rowId] — update a single row */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tableId: string; rowId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId, rowId } = await context.params

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

    const parsed = UpdateRowBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const row = await updateRow(tableId, rowId, parsed.data.data as RowData, requestId)
    return NextResponse.json({ success: true, data: { row: serializeRow(row) } })
  } catch (error) {
    logger.error(`[${requestId}] Error updating row ${rowId}:`, error)
    return NextResponse.json({ error: 'Failed to update row' }, { status: 500 })
  }
}

/** DELETE /api/table/[tableId]/rows/[rowId] — delete a single row */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tableId: string; rowId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId, rowId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'write')
    if (!access.ok) return accessError(access, requestId, tableId)

    await deleteRow(tableId, rowId, requestId)
    return NextResponse.json({ success: true, data: { message: 'Row deleted' } })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting row ${rowId}:`, error)
    return NextResponse.json({ error: 'Failed to delete row' }, { status: 500 })
  }
}
