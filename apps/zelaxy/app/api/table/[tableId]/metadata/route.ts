import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkHybridAuth } from '@/lib/auth/hybrid'
import { createLogger } from '@/lib/logs/console/logger'
import { updateTableMetadata } from '@/lib/table'
import type { TableMetadata } from '@/lib/table'
import { accessError, checkAccess } from '@/app/api/table/utils'

export const dynamic = 'force-dynamic'

const logger = createLogger('TableMetadataAPI')

const PatchBody = z.object({
  columnWidths: z.record(z.number()).optional(),
  columnOrder: z.array(z.string()).optional(),
})

/** PATCH /api/table/[tableId]/metadata — update column widths/order */
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

    const parsed = PatchBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    await updateTableMetadata(tableId, parsed.data as Partial<TableMetadata>, requestId)
    return NextResponse.json({ success: true, data: { message: 'Metadata updated' } })
  } catch (error) {
    logger.error(`[${requestId}] Error updating metadata for table ${tableId}:`, error)
    return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 })
  }
}
