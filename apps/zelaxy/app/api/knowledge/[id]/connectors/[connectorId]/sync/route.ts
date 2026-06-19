import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runConnectorSync } from '@/lib/knowledge/connectors/sync-runner'
import { createLogger } from '@/lib/logs/console/logger'
import { checkKnowledgeBaseAccess } from '@/app/api/knowledge/utils'
import { db } from '@/db'
import { knowledgeBaseConnector } from '@/db/schema'

const logger = createLogger('KnowledgeConnectorSyncAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MANUAL_COOLDOWN_MS = 5 * 60 * 1000

// POST /api/knowledge/[id]/connectors/[connectorId]/sync — trigger a manual sync
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; connectorId: string }> }
) {
  const { id: knowledgeBaseId, connectorId } = await params

  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await checkKnowledgeBaseAccess(knowledgeBaseId, session.user.id)
  if (!access.hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [connector] = await db
    .select()
    .from(knowledgeBaseConnector)
    .where(
      and(
        eq(knowledgeBaseConnector.id, connectorId),
        eq(knowledgeBaseConnector.knowledgeBaseId, knowledgeBaseId)
      )
    )
    .limit(1)
  if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

  if (connector.status === 'syncing') {
    return NextResponse.json({ error: 'A sync is already in progress' }, { status: 409 })
  }
  // 5-minute cooldown after the last manual/scheduled sync.
  if (
    connector.lastSyncAt &&
    Date.now() - new Date(connector.lastSyncAt).getTime() < MANUAL_COOLDOWN_MS
  ) {
    return NextResponse.json(
      { error: 'Please wait a few minutes between manual syncs' },
      { status: 429 }
    )
  }

  logger.info(`Manual sync triggered for connector ${connectorId}`)
  const summary = await runConnectorSync(connectorId)
  if (summary.error) {
    return NextResponse.json({ success: false, error: summary.error, summary }, { status: 502 })
  }
  return NextResponse.json({ success: true, summary })
}
