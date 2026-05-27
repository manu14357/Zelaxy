import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import {
  batchInsertRows,
  buildAutoMapping,
  coerceRowsForTable,
  CSV_MAX_FILE_SIZE_BYTES,
  deleteRows,
  listRows,
  parseCsvBuffer,
  validateMapping,
} from '@/lib/table'
import type { CsvHeaderMapping, RowData, TableSchema } from '@/lib/table'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableImportAPI')

const ImportBody = z.object({
  mode: z.enum(['append', 'replace']).default('append'),
  mapping: z.record(z.union([z.string(), z.null()])).optional(),
})

/**
 * POST /api/table/[tableId]/import — import CSV into an existing table.
 * Expects multipart/form-data with a `file` field (CSV) and optionally a `mode` and `mapping` JSON field.
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
    const schema = table.schema as TableSchema

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 415 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const csvFile = file as File
    if (csvFile.size > CSV_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 413 })
    }

    const modeRaw = formData.get('mode')
    const mappingRaw = formData.get('mapping')

    const parsedOptions = ImportBody.safeParse({
      mode: modeRaw ?? 'append',
      mapping: mappingRaw ? JSON.parse(String(mappingRaw)) : undefined,
    })
    if (!parsedOptions.success) {
      return NextResponse.json({ error: 'Invalid options' }, { status: 400 })
    }

    const { mode, mapping: providedMapping } = parsedOptions.data

    const buffer = Buffer.from(await csvFile.arrayBuffer())
    const { headers: csvHeaders, rows: csvRows } = await parseCsvBuffer(buffer)

    if (csvHeaders.length === 0) {
      return NextResponse.json({ error: 'CSV has no headers' }, { status: 400 })
    }

    const mapping: CsvHeaderMapping = (providedMapping as CsvHeaderMapping | undefined) ?? buildAutoMapping(csvHeaders, schema)

    const validation = validateMapping({ csvHeaders, mapping, tableSchema: schema })
    const coercedRows = coerceRowsForTable(csvRows, schema, validation.effectiveMap)

    let deletedCount = 0
    if (mode === 'replace') {
      const existing = await listRows({ tableId, limit: 10000, offset: 0 })
      if (existing.rows.length > 0) {
        deletedCount = await deleteRows(tableId, existing.rows.map((r) => r.id), requestId)
      }
    }

    const inserted = await batchInsertRows(
      {
        tableId,
        rows: coercedRows as RowData[],
        workspaceId: table.workspaceId,
        userId: authResult.userId,
      },
      table,
      requestId
    )

    logger.info(`[${requestId}] Imported ${inserted.length} rows into table ${tableId} (mode=${mode})`)

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: inserted.length,
        deletedCount,
        message: `Imported ${inserted.length} rows`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[${requestId}] Error importing CSV into table ${tableId}:`, error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
