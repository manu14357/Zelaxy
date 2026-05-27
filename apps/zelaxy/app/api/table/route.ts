import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import {
  createTable,
  getWorkspaceTableLimits,
  listTables,
  TableConflictError,
  type TableSchema,
  type TableScope,
} from '@/lib/table'
import { normalizeColumn } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableAPI')

const CreateTableSchema = z.object({
  name: z.string().min(1, 'Name is required').max(128),
  description: z.string().max(500).optional().default(''),
  workspaceId: z.string().min(1, 'workspaceId is required'),
  schema: z.object({
    columns: z
      .array(
        z.object({
          name: z.string().min(1),
          type: z.enum(['string', 'number', 'boolean', 'date', 'json']),
          required: z.boolean().optional(),
          unique: z.boolean().optional(),
        })
      )
      .min(1, 'At least one column is required'),
  }),
  initialRowCount: z.number().int().min(0).optional(),
})

const ListTablesQuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  scope: z.enum(['active', 'archived', 'all']).optional().default('active'),
})

async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<{ hasAccess: boolean; canWrite: boolean }> {
  const permission = await getUserEntityPermissions(userId, 'workspace', workspaceId)
  if (permission === null) return { hasAccess: false, canWrite: false }
  const canWrite = permission === 'admin' || permission === 'write'
  return { hasAccess: true, canWrite }
}

/** POST /api/table — creates a new user-defined table */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateTableSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const params = parsed.data

    const { hasAccess, canWrite } = await checkWorkspaceAccess(
      params.workspaceId,
      authResult.userId
    )

    if (!hasAccess || !canWrite) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const planLimits = await getWorkspaceTableLimits(params.workspaceId)

    const normalizedSchema: TableSchema = {
      columns: params.schema.columns.map(normalizeColumn),
    }

    const table = await createTable(
      {
        name: params.name,
        description: params.description,
        schema: normalizedSchema,
        workspaceId: params.workspaceId,
        userId: authResult.userId,
        maxRows: planLimits.maxRowsPerTable,
        maxTables: planLimits.maxTables,
        initialRowCount: params.initialRowCount,
      },
      requestId
    )

    logger.info(`[${requestId}] Table created: ${table.id} in workspace ${params.workspaceId}`)

    return NextResponse.json({
      success: true,
      data: {
        table: {
          id: table.id,
          name: table.name,
          description: table.description,
          schema: {
            columns: (table.schema as TableSchema).columns.map(normalizeColumn),
          },
          rowCount: table.rowCount,
          maxRows: table.maxRows,
          createdAt:
            table.createdAt instanceof Date
              ? table.createdAt.toISOString()
              : String(table.createdAt),
          updatedAt:
            table.updatedAt instanceof Date
              ? table.updatedAt.toISOString()
              : String(table.updatedAt),
        },
        message: 'Table created successfully',
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('maximum table limit')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (
        error.message.includes('Invalid table name') ||
        error.message.includes('Invalid schema') ||
        error.message.includes('already exists')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    if (error instanceof TableConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    logger.error(`[${requestId}] Error creating table:`, error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}

/** GET /api/table — lists all tables in a workspace */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const validation = ListTablesQuerySchema.safeParse({
      workspaceId: searchParams.get('workspaceId'),
      scope: searchParams.get('scope') ?? undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      )
    }

    const params = validation.data

    const { hasAccess } = await checkWorkspaceAccess(params.workspaceId, authResult.userId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const tables = await listTables(params.workspaceId, { scope: params.scope as TableScope })

    logger.info(`[${requestId}] Listed ${tables.length} tables in workspace ${params.workspaceId}`)

    const responseTables = tables.map((t) => {
      const schemaData = t.schema as TableSchema
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        schema: {
          columns: schemaData.columns.map(normalizeColumn),
        },
        rowCount: t.rowCount,
        maxRows: t.maxRows,
        workspaceId: t.workspaceId,
        createdBy: t.createdBy,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
        archivedAt:
          t.archivedAt instanceof Date
            ? t.archivedAt.toISOString()
            : t.archivedAt
              ? String(t.archivedAt)
              : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        tables: responseTables,
        totalCount: tables.length,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing tables:`, error)
    return NextResponse.json({ error: 'Failed to list tables' }, { status: 500 })
  }
}
