import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import {
  createTable,
  getWorkspaceTableLimits,
  listTables,
  TableConflictError,
  type TableSchema,
  validateTableName,
  validateTableSchema,
} from '@/lib/table'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1TablesAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const QuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  scope: z.enum(['active', 'archived', 'all']).optional().default('active'),
})

const ColumnSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date', 'json']),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
})

const CreateSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  name: z.string().min(1, 'name is required'),
  description: z.string().max(500).optional(),
  schema: z.object({ columns: z.array(ColumnSchema).min(1) }),
})

/** GET /api/v1/tables — List tables in a workspace. */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'tables')
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

    const { workspaceId, scope } = parsed.data

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId)
    if (accessError) return accessError

    const tables = await listTables(workspaceId, { scope })

    logger.info(`[${requestId}] Listed ${tables.length} tables for workspace ${workspaceId}`)

    return NextResponse.json({
      success: true,
      data: {
        tables: tables.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          rowCount: t.rowCount,
          maxRows: t.maxRows,
          columnCount: (t.schema as TableSchema).columns?.length ?? 0,
          workspaceId: t.workspaceId,
          archivedAt: t.archivedAt ? new Date(t.archivedAt).toISOString() : null,
          createdAt: new Date(t.createdAt).toISOString(),
          updatedAt: new Date(t.updatedAt).toISOString(),
        })),
        totalCount: tables.length,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing tables`, { error })
    return NextResponse.json({ error: 'Failed to list tables' }, { status: 500 })
  }
}

/** POST /api/v1/tables — Create a table. */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'tables')
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

    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { workspaceId, name, description, schema } = parsed.data

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId, 'write')
    if (accessError) return accessError

    // Validate name and schema
    const nameValidation = validateTableName(name)
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.errors.join(', ') }, { status: 400 })
    }

    const schemaValidation = validateTableSchema(schema as TableSchema)
    if (!schemaValidation.valid) {
      return NextResponse.json({ error: schemaValidation.errors.join(', ') }, { status: 400 })
    }

    // Check limits
    const limits = await getWorkspaceTableLimits(workspaceId)

    const table = await createTable(
      {
        name,
        description: description ?? null,
        schema: schema as TableSchema,
        workspaceId,
        userId,
        maxRows: limits.maxRowsPerTable,
        maxTables: limits.maxTables,
      },
      requestId
    )

    logger.info(`[${requestId}] Created table ${table.id} in workspace ${workspaceId}`)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: table.id,
          name: table.name,
          description: table.description,
          schema: table.schema,
          rowCount: table.rowCount,
          maxRows: table.maxRows,
          workspaceId: table.workspaceId,
          createdAt: new Date(table.createdAt).toISOString(),
          updatedAt: new Date(table.updatedAt).toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof TableConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    logger.error(`[${requestId}] Error creating table`, { error })
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
