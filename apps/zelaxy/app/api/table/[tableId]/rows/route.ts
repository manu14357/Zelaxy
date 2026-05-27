import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import {
  batchInsertRows,
  batchUpdateRows,
  deleteRows,
  insertRow,
  listRows,
  TABLE_LIMITS,
} from '@/lib/table'
import type { RowData, TableSchema } from '@/lib/table'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableRowsAPI')

const CreateRowBody = z.object({
  data: z.record(z.unknown()),
  workspaceId: z.string(),
  position: z.number().optional(),
})

const BatchCreateBody = z.object({
  rows: z.array(z.record(z.unknown())),
  workspaceId: z.string(),
  positions: z.array(z.number()).optional(),
})

const BatchUpdateBody = z.object({
  updates: z.array(
    z.object({
      rowId: z.string(),
      data: z.record(z.unknown()),
    })
  ),
})

const DeleteRowsBody = z.object({
  rowIds: z.array(z.string()),
})

/**
 * GET /api/table/[tableId]/rows — list rows (paginated)
 */
export async function GET(
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

    const access = await checkAccess(tableId, authResult.userId, 'read')
    if (!access.ok) return accessError(access, requestId, tableId)

    const { searchParams } = new URL(req.url)
    const limit = Math.min(
      Number(searchParams.get('limit') ?? TABLE_LIMITS.DEFAULT_QUERY_LIMIT),
      TABLE_LIMITS.MAX_QUERY_LIMIT
    )
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)
    const sortParam = searchParams.get('sort')
    const sort = sortParam ? JSON.parse(sortParam) : null

    const result = await listRows({ tableId, limit, offset, sort })

    return NextResponse.json({
      success: true,
      data: {
        rows: result.rows.map((r) => ({
          id: r.id,
          data: r.data,
          position: r.position,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
        })),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        nextOffset: result.hasMore ? offset + limit : null,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing rows for table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to list rows' }, { status: 500 })
  }
}

/**
 * POST /api/table/[tableId]/rows — create row(s)
 * Body can be either a single row or a batch of rows.
 */
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

    const { table } = access

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Batch create
    const batchParsed = BatchCreateBody.safeParse(body)
    if (batchParsed.success) {
      const { rows, workspaceId } = batchParsed.data
      if (workspaceId !== table.workspaceId) {
        return NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 })
      }
      const inserted = await batchInsertRows(
        {
          tableId,
          rows: rows as RowData[],
          workspaceId,
          userId: authResult.userId,
        },
        table,
        requestId
      )
      return NextResponse.json({
        success: true,
        data: {
          rows: inserted.map((r) => ({
            id: r.id,
            data: r.data,
            position: r.position,
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
          })),
          insertedCount: inserted.length,
          message: `Inserted ${inserted.length} rows`,
        },
      })
    }

    // Single row create
    const singleParsed = CreateRowBody.safeParse(body)
    if (!singleParsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { data: rowData, workspaceId, position } = singleParsed.data
    if (workspaceId !== table.workspaceId) {
      return NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 })
    }
    const row = await insertRow(
      { tableId, workspaceId, userId: authResult.userId, data: rowData as RowData, position },
      requestId
    )
    return NextResponse.json({
      success: true,
      data: {
        row: {
          id: row.id,
          data: row.data,
          position: row.position,
          createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
          updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
        },
        message: 'Row created',
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error creating row in table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to create row' }, { status: 500 })
  }
}

/**
 * PATCH /api/table/[tableId]/rows — batch update rows
 */
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

    const parsed = BatchUpdateBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    await batchUpdateRows(tableId, parsed.data.updates as Array<{ rowId: string; data: RowData }>, requestId)
    return NextResponse.json({ success: true, data: { message: 'Rows updated' } })
  } catch (error) {
    logger.error(`[${requestId}] Error batch updating rows in table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to update rows' }, { status: 500 })
  }
}

/**
 * DELETE /api/table/[tableId]/rows — delete rows by IDs
 */
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

    const parsed = DeleteRowsBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'rowIds array required' }, { status: 400 })
    }

    const deletedCount = await deleteRows(tableId, parsed.data.rowIds, requestId)
    return NextResponse.json({ success: true, data: { deletedCount, message: `Deleted ${deletedCount} rows` } })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting rows from table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to delete rows' }, { status: 500 })
  }
}
