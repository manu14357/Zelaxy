/**
 * Table-row polling service.
 *
 * Backs the `table` ("New Row") trigger. On a schedule it scans a watched user-defined table for
 * rows that appeared since the last poll, and posts a flattened event back to the workflow's
 * webhook trigger route so it runs like any other trigger.
 *
 * Two invariants (mirrors the workspace-events poller):
 *  - The watched table must live in the SAME workspace as the workflow hosting the trigger. Rows
 *    in tables belonging to another workspace are never delivered.
 *  - The first poll only seeds the cursor and fires nothing, so connecting the trigger never
 *    replays the table's existing rows.
 */

import { and, asc, eq, gte } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { createLogger } from '@/lib/logs/console/logger'
import { hasProcessedMessage, markMessageAsProcessed } from '@/lib/redis'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { userTableDefinitions, userTableRows, webhook, workflow } from '@/db/schema'

const logger = createLogger('TablePollingService')

/** Cap on remembered row ids per webhook, so providerConfig cannot grow without bound. */
const MAX_SEEN_IDS = 200

/** Never fire more than this many events from a single poll of one trigger. */
const MAX_EVENTS_PER_POLL = 20

interface TableTriggerConfig {
  tableId?: string
  seenRowIds?: string[]
  lastCheckedAt?: string
  /** Set once the first poll has seeded the cursor; guards against replaying existing rows. */
  initialized?: boolean
}

export interface RowRecord {
  id: string
  tableId: string
  data: Record<string, unknown>
  position: number
  createdAt: Date
}

export interface TableRowEvent {
  row_id: string
  table_id: string
  table_name: string
  data: Record<string, unknown>
  position: number
  created_at: string
}

export async function pollTableTriggers() {
  logger.debug('Starting table-row polling')

  const activeWebhooks = await db
    .select()
    .from(webhook)
    .where(and(eq(webhook.provider, 'table'), eq(webhook.isActive, true)))

  if (!activeWebhooks.length) {
    logger.debug('No active table webhooks found')
    return { total: 0, successful: 0, failed: 0, details: [] as any[] }
  }

  logger.info(`Found ${activeWebhooks.length} active table webhooks`)

  const CONCURRENCY = 5
  const details: any[] = []

  for (let i = 0; i < activeWebhooks.length; i += CONCURRENCY) {
    const batch = activeWebhooks.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(batch.map((w) => pollOneWebhook(w)))
    for (const r of settled) {
      details.push(r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) })
    }
  }

  const successful = details.filter((d) => d.success).length
  return { total: details.length, successful, failed: details.length - successful, details }
}

async function pollOneWebhook(webhookData: typeof webhook.$inferSelect) {
  const requestId = nanoid()
  const webhookId = webhookData.id
  const hostWorkflowId = webhookData.workflowId
  const config = (webhookData.providerConfig || {}) as TableTriggerConfig

  const tableId = (config.tableId || '').trim()
  if (!tableId) {
    logger.warn(`[${requestId}] table webhook ${webhookId} has no tableId configured`)
    return { success: false, webhookId, error: 'No tableId' }
  }

  // Resolve the workspace this trigger lives in.
  const [host] = await db
    .select({ workspaceId: workflow.workspaceId })
    .from(workflow)
    .where(eq(workflow.id, hostWorkflowId))
    .limit(1)

  const workspaceId = host?.workspaceId
  if (!workspaceId) {
    logger.warn(`[${requestId}] table webhook ${webhookId} host workflow has no workspace`)
    return { success: false, webhookId, error: 'No workspace' }
  }

  // Confirm the watched table belongs to the host workspace. This is the security boundary:
  // without it, a trigger could watch a table in another workspace.
  const [tableDef] = await db
    .select({ id: userTableDefinitions.id, name: userTableDefinitions.name })
    .from(userTableDefinitions)
    .where(
      and(eq(userTableDefinitions.id, tableId), eq(userTableDefinitions.workspaceId, workspaceId))
    )
    .limit(1)

  if (!tableDef) {
    logger.warn(
      `[${requestId}] table webhook ${webhookId} watches table ${tableId} not found in workspace ${workspaceId}`
    )
    return { success: false, webhookId, error: 'Table not in workspace' }
  }

  const tableName = tableDef.name

  // Cursor: only consider rows created at/after this instant. Seeded on the first poll.
  const cursorAt = config.lastCheckedAt ? new Date(config.lastCheckedAt) : new Date(0)
  const seen = new Set(config.seenRowIds || [])

  const rows = (await db
    .select({
      id: userTableRows.id,
      tableId: userTableRows.tableId,
      data: userTableRows.data,
      position: userTableRows.position,
      createdAt: userTableRows.createdAt,
    })
    .from(userTableRows)
    .where(and(eq(userTableRows.tableId, tableId), gte(userTableRows.createdAt, cursorAt)))
    .orderBy(asc(userTableRows.createdAt))
    .limit(500)) as RowRecord[]

  // First poll only seeds the cursor. Without this, connecting the trigger would immediately fire
  // once for every existing row — which is never what someone wants.
  if (!config.initialized) {
    await saveConfig(
      webhookId,
      config,
      rows.map((r) => r.id),
      latestCreatedAt(rows)
    )
    logger.info(
      `[${requestId}] Seeded table webhook ${webhookId} with ${rows.length} existing rows (no events triggered)`
    )
    return { success: true, webhookId, status: 'initialized', seeded: rows.length }
  }

  const newRows = pickNewRows(rows, seen, MAX_EVENTS_PER_POLL)

  if (!newRows.length) {
    await saveConfig(
      webhookId,
      config,
      rows.map((r) => r.id),
      latestCreatedAt(rows) ?? cursorAt
    )
    return { success: true, webhookId, status: 'no_new_rows' }
  }

  let triggered = 0
  for (const row of newRows) {
    // Guards against two cron runs overlapping on the same row.
    const dedupeKey = `table:${webhookId}:${row.id}`
    try {
      if (await hasProcessedMessage(dedupeKey)) continue
    } catch (err) {
      logger.warn(`[${requestId}] Redis dedupe check failed for ${row.id}, continuing`, err)
    }

    const event = buildRowEvent(row, tableName)

    try {
      const response = await fetch(`${getBaseUrl()}/api/webhooks/trigger/${webhookData.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Zelaxy/1.0' },
        body: JSON.stringify({ event }),
      })
      if (!response.ok) {
        logger.error(`[${requestId}] Failed to trigger workflow for row ${row.id}`)
        continue
      }
      triggered++
      try {
        await markMessageAsProcessed(dedupeKey)
      } catch {
        // Dedupe is best-effort; the seenRowIds cursor below is the durable guard.
      }
    } catch (error) {
      logger.error(`[${requestId}] Error triggering workflow for row ${row.id}`, error)
    }
  }

  await saveConfig(
    webhookId,
    config,
    rows.map((r) => r.id),
    latestCreatedAt(rows) ?? cursorAt
  )
  logger.info(
    `[${requestId}] Triggered ${triggered} new-row event(s) for table webhook ${webhookId}`
  )

  return { success: true, webhookId, status: 'triggered', triggered }
}

// ─── Helpers (pure, unit-tested) ─────────────────────────────────────────────

/** Selects the rows not already delivered, capped at `max`, preserving order. */
export function pickNewRows(rows: RowRecord[], seen: Set<string>, max: number): RowRecord[] {
  return rows.filter((r) => !seen.has(r.id)).slice(0, max)
}

/** Flattens a row record into the event delivered to the trigger route. */
export function buildRowEvent(row: RowRecord, tableName: string): TableRowEvent {
  return {
    row_id: row.id,
    table_id: row.tableId,
    table_name: tableName,
    data: (row.data || {}) as Record<string, unknown>,
    position: Number(row.position ?? 0),
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  }
}

export function latestCreatedAt(rows: RowRecord[]): Date | undefined {
  if (!rows.length) return undefined
  return rows.reduce((max, r) => (r.createdAt > max ? r.createdAt : max), rows[0].createdAt)
}

/**
 * Persists the cursor. Advances lastCheckedAt to the newest row seen and remembers a bounded set
 * of recent row ids, so a row straddling a poll boundary (equal timestamps) is not fired twice.
 */
async function saveConfig(
  webhookId: string,
  config: TableTriggerConfig,
  currentIds: string[],
  newCursor: Date | undefined
) {
  const merged = [...currentIds, ...(config.seenRowIds || [])]
  const deduped = Array.from(new Set(merged)).slice(0, MAX_SEEN_IDS)
  const cursorIso = (newCursor ?? new Date()).toISOString()

  await db
    .update(webhook)
    .set({
      providerConfig: {
        ...config,
        seenRowIds: deduped,
        initialized: true,
        lastCheckedAt: cursorIso,
      },
      updatedAt: new Date(),
    })
    .where(eq(webhook.id, webhookId))
}
