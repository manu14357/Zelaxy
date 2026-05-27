import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import {
  batchInsertRows,
  coerceRowsForTable,
  createTable,
  CSV_MAX_BATCH_SIZE,
  CSV_MAX_FILE_SIZE_BYTES,
  deleteTable,
  getWorkspaceTableLimits,
  inferSchemaFromCsv,
  parseCsvBuffer,
  sanitizeName,
  TABLE_LIMITS,
  TableConflictError,
  type TableDefinition,
  type TableSchema,
} from '@/lib/table'

export const dynamic = 'force-dynamic'

// Required to handle multipart form data in Next.js
export const config = {
  api: {
    bodyParser: false,
  },
}

const logger = createLogger('TableImportAPI')

const ALLOWED_EXTENSIONS = ['.csv', '.tsv']

function detectDelimiter(filename: string): string {
  return filename.toLowerCase().endsWith('.tsv') ? '\t' : ','
}

/** POST /api/table/import-csv — upload a CSV/TSV file and create a table */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  let createdTable: TableDefinition | null = null

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      )
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 })
    }

    const workspaceId = formData.get('workspaceId')
    const file = formData.get('file')
    const tableName = formData.get('tableName')

    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Check workspace access
    const permission = await getUserEntityPermissions(
      authResult.userId,
      'workspace',
      workspaceId
    )
    if (!permission || !(permission === 'admin' || permission === 'write')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate file extension
    const filename = file.name ?? 'upload.csv'
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > CSV_MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(CSV_MAX_FILE_SIZE_BYTES / 1024 / 1024)
      return NextResponse.json(
        { error: `File exceeds maximum size of ${maxMb} MB` },
        { status: 413 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Derive table name from filename or provided param
    const rawTableName =
      tableName && typeof tableName === 'string' && tableName.trim()
        ? tableName.trim()
        : filename.replace(/\.[^.]+$/, '')

    const derivedTableName = sanitizeName(rawTableName)
    if (!derivedTableName) {
      return NextResponse.json(
        { error: 'Could not derive a valid table name from the file name' },
        { status: 400 }
      )
    }

    // Read and parse the file
    const buffer = Buffer.from(await file.arrayBuffer())
    const delimiter = detectDelimiter(filename)

    let csvData: { headers: string[]; rows: Record<string, unknown>[] }
    try {
      csvData = await parseCsvBuffer(buffer, delimiter)
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to parse CSV: ${err instanceof Error ? err.message : 'unknown error'}` },
        { status: 400 }
      )
    }

    const { headers, rows } = csvData

    if (headers.length > TABLE_LIMITS.MAX_COLUMNS_PER_TABLE) {
      return NextResponse.json(
        {
          error: `CSV has ${headers.length} columns but the maximum is ${TABLE_LIMITS.MAX_COLUMNS_PER_TABLE}`,
        },
        { status: 400 }
      )
    }

    // Infer schema
    const { columns, headerToColumn } = inferSchemaFromCsv(headers, rows)
    const tableSchema: TableSchema = { columns }

    // Check plan limits
    const planLimits = await getWorkspaceTableLimits(workspaceId)
    const rowCount = rows.length

    if (rowCount > planLimits.maxRowsPerTable) {
      return NextResponse.json(
        {
          error: `CSV has ${rowCount} rows but the maximum is ${planLimits.maxRowsPerTable}`,
        },
        { status: 400 }
      )
    }

    // Create the table
    try {
      createdTable = await createTable(
        {
          name: derivedTableName,
          description: `Imported from ${filename}`,
          schema: tableSchema,
          workspaceId,
          userId: authResult.userId,
          maxRows: planLimits.maxRowsPerTable,
          maxTables: planLimits.maxTables,
        },
        requestId
      )
    } catch (err) {
      if (err instanceof TableConflictError) {
        return NextResponse.json({ error: err.message }, { status: 409 })
      }
      throw err
    }

    if (rowCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          tableId: createdTable.id,
          tableName: createdTable.name,
          rowsImported: 0,
          columnsImported: columns.length,
          message: 'Table created with no data rows',
        },
      })
    }

    // Coerce rows to match the inferred schema
    const coercedRows = coerceRowsForTable(rows, tableSchema, headerToColumn)

    // Insert rows in batches
    let totalInserted = 0
    let insertFailed = false

    try {
      for (let offset = 0; offset < coercedRows.length; offset += CSV_MAX_BATCH_SIZE) {
        const batch = coercedRows.slice(offset, offset + CSV_MAX_BATCH_SIZE)
        await batchInsertRows(
          {
            tableId: createdTable.id,
            rows: batch,
            workspaceId,
            userId: authResult.userId,
          },
          createdTable,
          requestId
        )
        totalInserted += batch.length
      }
    } catch (insertError) {
      insertFailed = true
      logger.error(`[${requestId}] Batch insert failed — rolling back table ${createdTable.id}`, insertError)

      // Rollback: archive the partially-created table
      try {
        await deleteTable(createdTable.id, requestId)
      } catch (cleanupError) {
        logger.error(`[${requestId}] Failed to cleanup table ${createdTable.id} after import error`, cleanupError)
      }

      return NextResponse.json(
        { error: 'Failed to insert rows. Import has been rolled back.' },
        { status: 500 }
      )
    }

    if (insertFailed) {
      // Guard — should not reach here, but just in case
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    logger.info(
      `[${requestId}] Imported ${totalInserted} rows into table ${createdTable.id} (workspace ${workspaceId})`
    )

    return NextResponse.json({
      success: true,
      data: {
        tableId: createdTable.id,
        tableName: createdTable.name,
        rowsImported: totalInserted,
        columnsImported: columns.length,
        message: `Successfully imported ${totalInserted} row${totalInserted !== 1 ? 's' : ''} into "${createdTable.name}"`,
      },
    })
  } catch (error) {
    // Attempt rollback if table was created before the unexpected error
    if (createdTable) {
      try {
        await deleteTable(createdTable.id, requestId)
      } catch (cleanupError) {
        logger.error(`[${requestId}] Failed to cleanup table ${createdTable.id}`, cleanupError)
      }
    }

    logger.error(`[${requestId}] Unexpected error during CSV import:`, error)
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 })
  }
}
