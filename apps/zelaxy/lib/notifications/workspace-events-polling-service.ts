/**
 * Workspace-events polling service.
 *
 * Backs the `workspace_events` trigger. Where lib/notifications/alerts.ts evaluates alert rules
 * per-run (fire-and-forget) and delivers them on an external channel, this service exposes the
 * SAME rule semantics as a composable trigger: on a schedule it scans recent workflow run logs
 * in the workspace, evaluates the trigger's configured rule, and posts a flattened event back to
 * the workflow's webhook trigger route so it runs like any other trigger.
 *
 * Two invariants:
 *  - The workflow HOSTING the trigger is always excluded, so reacting to an event can never
 *    re-trigger itself (an infinite loop).
 *  - The first poll only seeds the cursor and fires nothing, so connecting the trigger never
 *    replays the workspace's run history.
 */

import { and, asc, desc, eq, gte, inArray, ne } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { Logger } from '@/lib/logs/console/logger'
import { hasProcessedMessage, markMessageAsProcessed } from '@/lib/redis'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { webhook, workflow, workflowExecutionLogs } from '@/db/schema'

const logger = new Logger('WorkspaceEventsPollingService')

/** Cap on remembered execution ids per webhook, so providerConfig cannot grow without bound. */
const MAX_SEEN_IDS = 200

/** Never fire more than this many events from a single poll of one trigger. */
const MAX_EVENTS_PER_POLL = 10

/** Mirror alerts.ts: rate/spike rules need a minimum sample before they mean anything. */
const MIN_RUNS_FOR_RATE = 5

interface WorkspaceEventsConfig {
  ruleType?: string
  ruleConfig?: any
  workflowIds?: string | string[]
  seenExecutionIds?: string[]
  lastCheckedAt?: string
  /** Set once the first poll has seeded the cursor; guards against replaying run history. */
  initialized?: boolean
}

interface RunLog {
  workflowId: string
  workflowName: string
  executionId: string
  level: string
  trigger: string
  totalDurationMs: number | null
  totalCost: string | null
  startedAt: Date
  endedAt: Date | null
}

export async function pollWorkspaceEvents() {
  logger.debug('Starting workspace-events polling')

  const activeWebhooks = await db
    .select()
    .from(webhook)
    .where(and(eq(webhook.provider, 'workspace_events'), eq(webhook.isActive, true)))

  if (!activeWebhooks.length) {
    logger.debug('No active workspace-events webhooks found')
    return { total: 0, successful: 0, failed: 0, details: [] as any[] }
  }

  logger.info(`Found ${activeWebhooks.length} active workspace-events webhooks`)

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
  const config = (webhookData.providerConfig || {}) as WorkspaceEventsConfig

  // Resolve the workspace this trigger lives in.
  const [host] = await db
    .select({ workspaceId: workflow.workspaceId })
    .from(workflow)
    .where(eq(workflow.id, hostWorkflowId))
    .limit(1)

  const workspaceId = host?.workspaceId
  if (!workspaceId) {
    logger.warn(
      `[${requestId}] workspace-events webhook ${webhookId} host workflow has no workspace`
    )
    return { success: false, webhookId, error: 'No workspace' }
  }

  const ruleType = (config.ruleType || 'any').trim()
  const ruleCfg = parseRuleConfig(config.ruleConfig)
  const scopedWorkflowIds = parseWorkflowIds(config.workflowIds).filter(
    (id) => id !== hostWorkflowId
  )

  // Cursor: only consider runs at/after this instant. Seeded on the first poll.
  const cursorAt = config.lastCheckedAt ? new Date(config.lastCheckedAt) : new Date(0)
  const seen = new Set(config.seenExecutionIds || [])

  // Only completed runs matter; execution logs are written once per completed run.
  const conditions = [
    eq(workflow.workspaceId, workspaceId),
    ne(workflowExecutionLogs.workflowId, hostWorkflowId), // never react to our own runs
    gte(workflowExecutionLogs.startedAt, cursorAt),
  ]
  if (scopedWorkflowIds.length > 0) {
    conditions.push(inArray(workflowExecutionLogs.workflowId, scopedWorkflowIds))
  }

  const rows = (await db
    .select({
      workflowId: workflowExecutionLogs.workflowId,
      workflowName: workflow.name,
      executionId: workflowExecutionLogs.executionId,
      level: workflowExecutionLogs.level,
      trigger: workflowExecutionLogs.trigger,
      totalDurationMs: workflowExecutionLogs.totalDurationMs,
      totalCost: workflowExecutionLogs.totalCost,
      startedAt: workflowExecutionLogs.startedAt,
      endedAt: workflowExecutionLogs.endedAt,
    })
    .from(workflowExecutionLogs)
    .innerJoin(workflow, eq(workflowExecutionLogs.workflowId, workflow.id))
    .where(and(...conditions))
    .orderBy(asc(workflowExecutionLogs.startedAt))
    .limit(500)) as RunLog[]

  // First poll only seeds the cursor. Without this, connecting the trigger would immediately fire
  // once for every historical run that already matches — which is never what someone wants.
  if (!config.initialized) {
    await saveConfig(
      webhookId,
      config,
      rows.map((r) => r.executionId),
      latestStartedAt(rows)
    )
    logger.info(
      `[${requestId}] Seeded workspace-events webhook ${webhookId} with ${rows.length} existing runs (no events triggered)`
    )
    return { success: true, webhookId, status: 'initialized', seeded: rows.length }
  }

  const newRows = rows.filter((r) => !seen.has(r.executionId)).slice(0, MAX_EVENTS_PER_POLL)

  if (!newRows.length) {
    await saveConfig(
      webhookId,
      config,
      rows.map((r) => r.executionId),
      latestStartedAt(rows) ?? cursorAt
    )
    return { success: true, webhookId, status: 'no_new_events' }
  }

  let triggered = 0
  for (const row of newRows) {
    let reason: string | null
    try {
      reason = await ruleFires(ruleType, ruleCfg, row)
    } catch (err) {
      logger.warn(`[${requestId}] Rule evaluation failed for ${row.executionId}`, err)
      continue
    }
    if (!reason) continue

    // Guards against two cron runs overlapping on the same event.
    const dedupeKey = `workspace_events:${webhookId}:${row.executionId}`
    try {
      if (await hasProcessedMessage(dedupeKey)) continue
    } catch (err) {
      logger.warn(
        `[${requestId}] Redis dedupe check failed for ${row.executionId}, continuing`,
        err
      )
    }

    const event = {
      rule_type: ruleType,
      reason,
      workflow_id: row.workflowId,
      workflow_name: row.workflowName,
      execution_id: row.executionId,
      status: row.level === 'error' ? 'error' : 'success',
      level: row.level,
      trigger: row.trigger,
      duration_ms: Number(row.totalDurationMs ?? 0),
      cost: Number(row.totalCost ?? 0),
      started_at:
        row.startedAt instanceof Date ? row.startedAt.toISOString() : String(row.startedAt),
      ended_at:
        row.endedAt instanceof Date
          ? row.endedAt.toISOString()
          : row.endedAt
            ? String(row.endedAt)
            : '',
    }

    try {
      const response = await fetch(`${getBaseUrl()}/api/webhooks/trigger/${webhookData.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Zelaxy/1.0' },
        body: JSON.stringify({ event }),
      })
      if (!response.ok) {
        logger.error(`[${requestId}] Failed to trigger workflow for event ${row.executionId}`)
        continue
      }
      triggered++
      try {
        await markMessageAsProcessed(dedupeKey)
      } catch {
        // Dedupe is best-effort; the seenExecutionIds cursor below is the durable guard.
      }
    } catch (error) {
      logger.error(`[${requestId}] Error triggering workflow for event ${row.executionId}`, error)
    }
  }

  await saveConfig(
    webhookId,
    config,
    rows.map((r) => r.executionId),
    latestStartedAt(rows) ?? cursorAt
  )
  logger.info(
    `[${requestId}] Triggered ${triggered} event(s) for workspace-events webhook ${webhookId}`
  )

  return { success: true, webhookId, status: 'triggered', triggered }
}

// ─── Rule evaluation (mirrors lib/notifications/alerts.ts ruleFires) ──────────

async function ruleFires(ruleType: string, cfg: any, run: RunLog): Promise<string | null> {
  const durationMs = Number(run.totalDurationMs ?? 0)
  const cost = Number(run.totalCost ?? 0)

  switch (ruleType) {
    case 'any':
      return `Run ${run.level === 'error' ? 'failed' : 'succeeded'}`

    case 'latency_threshold': {
      const ms = Number(cfg.durationMs ?? 30000)
      return durationMs > ms ? `Run took ${durationMs}ms (threshold ${ms}ms)` : null
    }
    case 'cost_threshold': {
      const dollars = Number(cfg.dollars ?? 1)
      return cost > dollars ? `Run cost $${cost.toFixed(4)} (threshold $${dollars})` : null
    }
    case 'consecutive_failures': {
      const count = Math.max(1, Math.min(100, Number(cfg.count ?? 3)))
      const recent = await db
        .select({ level: workflowExecutionLogs.level })
        .from(workflowExecutionLogs)
        .where(eq(workflowExecutionLogs.workflowId, run.workflowId))
        .orderBy(desc(workflowExecutionLogs.startedAt))
        .limit(count)
      return recent.length === count && recent.every((r) => r.level === 'error')
        ? `Last ${count} runs all failed`
        : null
    }
    case 'error_count':
    case 'failure_rate':
    case 'latency_spike': {
      const windowHours = Math.max(1, Math.min(168, Number(cfg.windowHours ?? 24)))
      const since = new Date(Date.now() - windowHours * 3600_000)
      const recent = await db
        .select({
          level: workflowExecutionLogs.level,
          durationMs: workflowExecutionLogs.totalDurationMs,
        })
        .from(workflowExecutionLogs)
        .where(
          and(
            eq(workflowExecutionLogs.workflowId, run.workflowId),
            gte(workflowExecutionLogs.startedAt, since)
          )
        )
      const total = recent.length
      const errors = recent.filter((r) => r.level === 'error').length

      if (ruleType === 'error_count') {
        const threshold = Math.max(1, Number(cfg.count ?? 5))
        return errors >= threshold ? `${errors} errors in the last ${windowHours}h` : null
      }
      if (ruleType === 'failure_rate') {
        if (total < MIN_RUNS_FOR_RATE) return null
        const pct = (errors / total) * 100
        const threshold = Number(cfg.percent ?? 50)
        return pct >= threshold
          ? `Failure rate ${pct.toFixed(0)}% over ${windowHours}h (threshold ${threshold}%)`
          : null
      }
      // latency_spike
      if (total < MIN_RUNS_FOR_RATE) return null
      const durations = recent.map((r) => Number(r.durationMs ?? 0)).filter((d) => d > 0)
      if (durations.length === 0) return null
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const pctSlower = Number(cfg.percent ?? 100)
      return durationMs > avg * (1 + pctSlower / 100)
        ? `Run ${durationMs}ms is >${pctSlower}% slower than recent avg ${Math.round(avg)}ms`
        : null
    }
    default:
      // 'no_activity' has no triggering run, so it is not exposed by this poll-driven trigger.
      return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRuleConfig(raw: any): any {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function parseWorkflowIds(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean)
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function latestStartedAt(rows: RunLog[]): Date | undefined {
  if (!rows.length) return undefined
  return rows.reduce((max, r) => (r.startedAt > max ? r.startedAt : max), rows[0].startedAt)
}

/**
 * Persists the cursor. Advances lastCheckedAt to the newest run seen and remembers a bounded set
 * of recent execution ids, so an event straddling a poll boundary (equal timestamps) is not fired
 * twice.
 */
async function saveConfig(
  webhookId: string,
  config: WorkspaceEventsConfig,
  currentIds: string[],
  newCursor: Date | undefined
) {
  const merged = [...currentIds, ...(config.seenExecutionIds || [])]
  const deduped = Array.from(new Set(merged)).slice(0, MAX_SEEN_IDS)
  const cursorIso = (newCursor ?? new Date()).toISOString()

  await db
    .update(webhook)
    .set({
      providerConfig: {
        ...config,
        seenExecutionIds: deduped,
        initialized: true,
        lastCheckedAt: cursorIso,
      },
      updatedAt: new Date(),
    })
    .where(eq(webhook.id, webhookId))
}
