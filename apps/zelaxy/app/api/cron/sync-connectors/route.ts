import { and, eq, lte, ne } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { runConnectorSync } from '@/lib/knowledge/connectors/sync-runner'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { knowledgeBaseConnector } from '@/db/schema'

const logger = createLogger('CronSyncConnectors')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_PER_RUN = 25

/**
 * Run every connector whose scheduled sync is due. Intended to be hit on a schedule (e.g. an
 * hourly cron). Picks enabled, non-paused/disabled connectors with `nextSyncAt <= now`, capped
 * per run so one invocation can't run unbounded.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request, 'sync connectors')
  if (authError) return authError

  const now = new Date()
  const due = await db
    .select({ id: knowledgeBaseConnector.id })
    .from(knowledgeBaseConnector)
    .where(
      and(
        eq(knowledgeBaseConnector.enabled, true),
        ne(knowledgeBaseConnector.status, 'paused'),
        ne(knowledgeBaseConnector.status, 'disabled'),
        ne(knowledgeBaseConnector.status, 'syncing'),
        lte(knowledgeBaseConnector.nextSyncAt, now),
        // Rows with a null nextSyncAt (e.g. manual-only) are excluded by lte, which is intended —
        // manual connectors are never auto-synced here.
        ne(knowledgeBaseConnector.frequency, 'manual')
      )
    )
    .limit(MAX_PER_RUN)

  logger.info(`Running ${due.length} due connector sync(s)`)
  const results = []
  for (const c of due) {
    const summary = await runConnectorSync(c.id)
    results.push({ id: c.id, summary })
  }

  return NextResponse.json({ success: true, ran: due.length, results })
}
