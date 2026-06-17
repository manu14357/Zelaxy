import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import { deleteTable, renameTable, TableConflictError, type TableSchema } from '@/lib/table'
import { accessError, checkAccess, normalizeColumn } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableByIdAPI')

const PatchBodySchema = z.object({
  name: z.string().min(1).max(128),
})

/** GET /api/table/[tableId] — get a table definition */
export async function GET(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'read')

    if (!access.ok) {
      return accessError(access, requestId, tableId)
    }

    const { table } = access
    const schemaData = table.schema as TableSchema

    logger.info(`[${requestId}] Fetched table ${tableId}`)

    return NextResponse.json({
      success: true,
      data: {
        table: {
          id: table.id,
          name: table.name,
          description: table.description,
          schema: {
            columns: schemaData.columns.map(normalizeColumn),
          },
          rowCount: table.rowCount,
          maxRows: table.maxRows,
          workspaceId: table.workspaceId,
          createdBy: table.createdBy,
          createdAt:
            table.createdAt instanceof Date
              ? table.createdAt.toISOString()
              : String(table.createdAt),
          updatedAt:
            table.updatedAt instanceof Date
              ? table.updatedAt.toISOString()
              : String(table.updatedAt),
          archivedAt:
            table.archivedAt instanceof Date
              ? table.archivedAt.toISOString()
              : table.archivedAt
                ? String(table.archivedAt)
                : null,
        },
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to get table' }, { status: 500 })
  }
}

/** PATCH /api/table/[tableId] — rename a table */
export async function PATCH(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'write')
    if (!access.ok) {
      return accessError(access, requestId, tableId)
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = PatchBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name } = parsed.data

    const updated = await renameTable(tableId, name, requestId).catch((err) => {
      if (err instanceof TableConflictError) throw err
      throw err
    })

    logger.info(`[${requestId}] Renamed table ${tableId} to "${name}"`)

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        message: 'Table renamed successfully',
      },
    })
  } catch (error) {
    if (error instanceof TableConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof Error && error.message.includes('Invalid table name')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    logger.error(`[${requestId}] Error renaming table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to rename table' }, { status: 500 })
  }
}

/** DELETE /api/table/[tableId] — archive (soft-delete) a table */
export async function DELETE(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'admin')
    if (!access.ok) {
      return accessError(access, requestId, tableId)
    }

    await deleteTable(tableId, requestId)

    logger.info(`[${requestId}] Archived (deleted) table ${tableId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: tableId,
        message: 'Table deleted successfully',
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
