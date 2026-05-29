import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import {
  batchInsertRows,
  getTableById,
  insertRow,
  listRows,
  type RowData,
} from '@/lib/table'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import {
  checkRateLimit,
  createRateLimitResponse,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1TableRowsAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

const InsertRowSchema = z.object({
  data: z.record(z.unknown()),
  position: z.number().int().optional(),
})

const BatchInsertSchema = z.object({
  rows: z.array(z.record(z.unknown())).min(1).max(1000),
})

const InsertBodySchema = z.union([InsertRowSchema, BatchInsertSchema])

/** GET /api/v1/tables/[tableId]/rows — List rows in a table. */
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
    const { searchParams } = new URL(request.url)
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { limit, offset } = parsed.data

    const table = await getTableById(tableId)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const permission = await getUserEntityPermissions(userId, 'workspace', table.workspaceId)
    if (permission === null) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const result = await listRows({ tableId, limit, offset })

    logger.info(`[${requestId}] Listed ${result.rows.length} rows for table ${tableId}`)

    return NextResponse.json({
      success: true,
      data: {
        rows: result.rows.map((r) => ({
          id: r.id,
          data: r.data,
          position: r.position,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        limit,
        offset,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing rows`, { error })
    return NextResponse.json({ error: 'Failed to list rows' }, { status: 500 })
  }
}

/**
 * POST /api/v1/tables/[tableId]/rows — Insert one or multiple rows.
 *
 * Single row: `{ data: { col: value, ... }, position?: number }`
 * Batch insert: `{ rows: [{ col: value, ... }, ...] }`
 */
export async function POST(
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

    const parsed = InsertBodySchema.safeParse(body)
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

    // Batch insert
    if ('rows' in parsed.data) {
      const inserted = await batchInsertRows(
        {
          tableId,
          rows: parsed.data.rows as RowData[],
          workspaceId: table.workspaceId,
          userId,
        },
        table,
        requestId
      )
      logger.info(`[${requestId}] Batch inserted ${inserted.length} rows into table ${tableId}`)
      return NextResponse.json(
        {
          success: true,
          data: {
            rows: inserted.map((r) => ({
              id: r.id,
              data: r.data,
              position: r.position,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            insertedCount: inserted.length,
          },
        },
        { status: 201 }
      )
    }

    // Single row insert
    const row = await insertRow(
      {
        tableId,
        workspaceId: table.workspaceId,
        userId,
        data: parsed.data.data as RowData,
        position: parsed.data.position,
      },
      requestId
    )

    logger.info(`[${requestId}] Inserted row ${row.id} into table ${tableId}`)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: row.id,
          data: row.data,
          position: row.position,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error(`[${requestId}] Error inserting row(s)`, { error })
    return NextResponse.json({ error: 'Failed to insert row(s)' }, { status: 500 })
  }
}
