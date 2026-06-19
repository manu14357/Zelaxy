/**
 * Workspace alerts: rule evaluation + multi-channel delivery.
 *
 * An alert = a rule (condition + thresholds) + a delivery channel (webhook / email / slack).
 * `evaluateAlertsForRun` is called (fire-and-forget) when a workflow run completes; it checks
 * each enabled alert's scope/filters/cooldown, evaluates the rule against recent run logs,
 * and delivers a signed payload on the configured channel.
 */

import { createHmac } from 'node:crypto'
import { and, desc, eq, gte } from 'drizzle-orm'
import { sendEmail } from '@/lib/email/mailer'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflowExecutionLogs, workspaceNotification } from '@/db/schema'

const logger = createLogger('Alerts')

const COOLDOWN_MS = 60 * 60 * 1000 // 1 hour, per the spec
const MIN_RUNS_FOR_RATE = 5

export type AlertRuleType =
  | 'consecutive_failures'
  | 'failure_rate'
  | 'error_count'
  | 'latency_threshold'
  | 'latency_spike'
  | 'cost_threshold'
  | 'no_activity'

export type AlertChannelType = 'webhook' | 'email' | 'slack'

export interface RunSummaryForAlert {
  workspaceId: string
  workflowId: string
  workflowName: string
  executionId: string
  status: 'success' | 'error'
  level: 'info' | 'error'
  trigger: string
  totalDurationMs: number
  cost: number
  startedAt: string
  endedAt: string
}

interface NotificationRow {
  id: string
  workspaceId: string
  name: string
  enabled: boolean
  ruleType: string
  ruleConfig: any
  channelType: string
  channelConfig: any
  levelFilter: string | null
  triggerFilter: any
  workflowIds: any
  lastFiredAt: Date | null
}

// ─── Delivery ────────────────────────────────────────────────────────────────

export function signWebhookBody(secret: string, timestamp: number, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
}

export function buildAlertPayload(notification: { id: string }, run: RunSummaryForAlert) {
  return {
    id: `evt_${notification.id}_${run.executionId}`,
    type: 'workflow.execution.completed',
    timestamp: Date.now(),
    data: {
      workflowId: run.workflowId,
      workflowName: run.workflowName,
      executionId: run.executionId,
      status: run.status,
      level: run.level,
      trigger: run.trigger,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      totalDurationMs: run.totalDurationMs,
      cost: { total: run.cost },
    },
  }
}

export async function deliverAlert(
  channelType: string,
  channelConfig: any,
  payload: Record<string, any>,
  summaryText: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (channelType === 'webhook') {
      const url: string = channelConfig?.url
      if (!url) return { ok: false, error: 'Webhook URL not configured' }
      const rawBody = JSON.stringify(payload)
      const timestamp = Date.now()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'zelaxy-event': String(payload.type ?? 'alert'),
        'zelaxy-timestamp': String(timestamp),
        'Idempotency-Key': String(payload.id ?? `${timestamp}`),
      }
      if (channelConfig.secret) {
        headers['zelaxy-signature'] =
          `t=${timestamp},v1=${signWebhookBody(channelConfig.secret, timestamp, rawBody)}`
      }
      const res = await fetch(url, { method: 'POST', headers, body: rawBody })
      return res.ok ? { ok: true } : { ok: false, error: `Webhook returned ${res.status}` }
    }

    if (channelType === 'email') {
      const recipients: string[] = Array.isArray(channelConfig?.recipients)
        ? channelConfig.recipients.slice(0, 10)
        : []
      if (recipients.length === 0) return { ok: false, error: 'No email recipients configured' }
      const html = `<h2>Zelaxy alert</h2><p>${summaryText}</p><pre>${JSON.stringify(payload.data, null, 2)}</pre>`
      await Promise.all(
        recipients.map((to) =>
          sendEmail({
            to,
            subject: `Zelaxy alert: ${payload.data?.workflowName ?? 'workflow'}`,
            html,
            emailType: 'notifications',
          })
        )
      )
      return { ok: true }
    }

    if (channelType === 'slack') {
      // Slack delivery via an incoming-webhook URL configured on the alert.
      const url: string = channelConfig?.url
      if (!url) return { ok: false, error: 'Slack webhook URL not configured' }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summaryText }),
      })
      return res.ok ? { ok: true } : { ok: false, error: `Slack returned ${res.status}` }
    }

    return { ok: false, error: `Unknown channel type: ${channelType}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Delivery failed' }
  }
}

// ─── Rule evaluation ─────────────────────────────────────────────────────────

function passesFilters(n: NotificationRow, run: RunSummaryForAlert): boolean {
  if (n.levelFilter && n.levelFilter !== run.level) return false
  if (
    Array.isArray(n.triggerFilter) &&
    n.triggerFilter.length > 0 &&
    !n.triggerFilter.includes(run.trigger)
  )
    return false
  if (
    Array.isArray(n.workflowIds) &&
    n.workflowIds.length > 0 &&
    !n.workflowIds.includes(run.workflowId)
  )
    return false
  return true
}

async function ruleFires(n: NotificationRow, run: RunSummaryForAlert): Promise<string | null> {
  const cfg = n.ruleConfig || {}

  switch (n.ruleType) {
    case 'latency_threshold': {
      const ms = Number(cfg.durationMs ?? 30000)
      return run.totalDurationMs > ms
        ? `Run took ${run.totalDurationMs}ms (threshold ${ms}ms)`
        : null
    }
    case 'cost_threshold': {
      const dollars = Number(cfg.dollars ?? 1)
      return run.cost > dollars ? `Run cost $${run.cost.toFixed(4)} (threshold $${dollars})` : null
    }
    case 'consecutive_failures': {
      const count = Math.max(1, Math.min(100, Number(cfg.count ?? 3)))
      const rows = await db
        .select({ level: workflowExecutionLogs.level })
        .from(workflowExecutionLogs)
        .where(eq(workflowExecutionLogs.workflowId, run.workflowId))
        .orderBy(desc(workflowExecutionLogs.startedAt))
        .limit(count)
      return rows.length === count && rows.every((r) => r.level === 'error')
        ? `Last ${count} runs all failed`
        : null
    }
    case 'error_count':
    case 'failure_rate':
    case 'latency_spike': {
      const windowHours = Math.max(1, Math.min(168, Number(cfg.windowHours ?? 24)))
      const since = new Date(Date.now() - windowHours * 3600_000)
      const rows = await db
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
      const total = rows.length
      const errors = rows.filter((r) => r.level === 'error').length

      if (n.ruleType === 'error_count') {
        const threshold = Math.max(1, Number(cfg.count ?? 5))
        return errors >= threshold ? `${errors} errors in the last ${windowHours}h` : null
      }
      if (n.ruleType === 'failure_rate') {
        if (total < MIN_RUNS_FOR_RATE) return null
        const pct = (errors / total) * 100
        const threshold = Number(cfg.percent ?? 50)
        return pct >= threshold
          ? `Failure rate ${pct.toFixed(0)}% over ${windowHours}h (threshold ${threshold}%)`
          : null
      }
      // latency_spike
      if (total < MIN_RUNS_FOR_RATE) return null
      const durations = rows.map((r) => Number(r.durationMs ?? 0)).filter((d) => d > 0)
      if (durations.length === 0) return null
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const pctSlower = Number(cfg.percent ?? 100)
      return run.totalDurationMs > avg * (1 + pctSlower / 100)
        ? `Run ${run.totalDurationMs}ms is >${pctSlower}% slower than recent avg ${Math.round(avg)}ms`
        : null
    }
    default:
      // 'no_activity' is evaluated by a background poll, not per-run.
      return null
  }
}

/**
 * Evaluate every enabled alert for a completed run and dispatch any that fire.
 * Safe to call fire-and-forget — never throws.
 */
export async function evaluateAlertsForRun(run: RunSummaryForAlert): Promise<void> {
  try {
    const notifications = (await db
      .select()
      .from(workspaceNotification)
      .where(
        and(
          eq(workspaceNotification.workspaceId, run.workspaceId),
          eq(workspaceNotification.enabled, true)
        )
      )) as unknown as NotificationRow[]

    for (const n of notifications) {
      try {
        if (!passesFilters(n, run)) continue
        if (n.lastFiredAt && Date.now() - new Date(n.lastFiredAt).getTime() < COOLDOWN_MS) continue

        const reason = await ruleFires(n, run)
        if (!reason) continue

        const payload = buildAlertPayload(n, run)
        const summary = `Alert "${n.name}" on ${run.workflowName}: ${reason}`
        const result = await deliverAlert(n.channelType, n.channelConfig, payload, summary)

        if (result.ok) {
          await db
            .update(workspaceNotification)
            .set({ lastFiredAt: new Date() })
            .where(eq(workspaceNotification.id, n.id))
          logger.info('Alert fired', { id: n.id, channel: n.channelType })
        } else {
          logger.warn('Alert delivery failed', { id: n.id, error: result.error })
        }
      } catch (inner) {
        logger.error('Alert evaluation error', { id: n.id, inner })
      }
    }
  } catch (e) {
    logger.error('evaluateAlertsForRun failed', { e })
  }
}
