import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import type { ColumnDefinition, TableDefinition } from '@/lib/table'
import { getTableById } from '@/lib/table'

const logger = createLogger('TableUtils')

// ─── Access helpers ───────────────────────────────────────────────────────────

export type AccessResult = { ok: true; table: TableDefinition } | { ok: false; status: 404 | 403 }

export async function checkAccess(
  tableId: string,
  userId: string,
  level: 'read' | 'write' | 'admin' = 'read'
): Promise<AccessResult> {
  const table = await getTableById(tableId)

  if (!table) {
    return { ok: false, status: 404 }
  }

  const permission = await getUserEntityPermissions(userId, 'workspace', table.workspaceId)
  const hasAccess =
    permission !== null &&
    (level === 'read' ||
      (level === 'write' && (permission === 'write' || permission === 'admin')) ||
      (level === 'admin' && permission === 'admin'))

  return hasAccess ? { ok: true, table } : { ok: false, status: 403 }
}

export function accessError(
  result: { ok: false; status: 404 | 403 },
  requestId: string,
  context?: string
): NextResponse {
  const message = result.status === 404 ? 'Table not found' : 'Access denied'
  logger.warn(`[${requestId}] ${message}${context ? `: ${context}` : ''}`)
  return NextResponse.json({ error: message }, { status: result.status })
}

// ─── Column normalization ─────────────────────────────────────────────────────

export function normalizeColumn(col: ColumnDefinition): ColumnDefinition {
  return {
    name: col.name,
    type: col.type,
    required: col.required ?? false,
    unique: col.unique ?? false,
    ...(col.workflowGroupId ? { workflowGroupId: col.workflowGroupId } : {}),
  }
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function errorResponse(message: string, status: number, details?: unknown): NextResponse {
  const body: { error: string; details?: unknown } = { error: message }
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}
