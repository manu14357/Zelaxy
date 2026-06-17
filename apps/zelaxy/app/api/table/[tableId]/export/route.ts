import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import type { ColumnDefinition, TableSchema } from '@/lib/table'
import { listRows } from '@/lib/table'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableExportAPI')

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** GET /api/table/[tableId]/export — export table as CSV */
export async function GET(req: NextRequest, context: { params: Promise<{ tableId: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { tableId } = await context.params

  try {
    const authResult = await checkHybridAuth(req, { requireWorkflowId: false })
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const access = await checkAccess(tableId, authResult.userId, 'read')
    if (!access.ok) return accessError(access, requestId, tableId)

    const { table } = access
    const schema = table.schema as TableSchema
    const columns: ColumnDefinition[] = schema.columns ?? []

    // Fetch all rows (up to 10k)
    const result = await listRows({ tableId, limit: 10000, offset: 0 })

    const header = columns.map((c) => escapeCsvValue(c.name)).join(',')
    const csvRows = result.rows.map((row) =>
      columns.map((c) => escapeCsvValue(row.data[c.name])).join(',')
    )
    const csv = [header, ...csvRows].join('\n')

    const filename = `${table.name.replace(/[^a-z0-9_-]/gi, '_')}.csv`

    logger.info(`[${requestId}] Exported ${result.rows.length} rows from table ${tableId}`)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error exporting table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to export table' }, { status: 500 })
  }
}
