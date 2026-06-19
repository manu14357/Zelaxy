import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { CONNECTOR_REGISTRY } from '@/lib/knowledge/connectors/registry'
import { createLogger } from '@/lib/logs/console/logger'
import { checkKnowledgeBaseAccess } from '@/app/api/knowledge/utils'
import { db } from '@/db'
import { knowledgeBaseConnector } from '@/db/schema'

const logger = createLogger('KnowledgeConnectorsAPI')

export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  type: z.enum(['github', 'web']),
  name: z.string().min(1).max(100),
  config: z.record(z.any()).default({}),
  credential: z.string().nullable().optional(),
  frequency: z.enum(['hourly', '6h', 'daily', 'weekly', 'manual']).default('daily'),
})

// GET /api/knowledge/[id]/connectors — list connectors for a knowledge base
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: knowledgeBaseId } = await params
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await checkKnowledgeBaseAccess(knowledgeBaseId, session.user.id)
  if (!access.hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await db
    .select({
      id: knowledgeBaseConnector.id,
      type: knowledgeBaseConnector.type,
      name: knowledgeBaseConnector.name,
      config: knowledgeBaseConnector.config,
      frequency: knowledgeBaseConnector.frequency,
      status: knowledgeBaseConnector.status,
      enabled: knowledgeBaseConnector.enabled,
      lastSyncAt: knowledgeBaseConnector.lastSyncAt,
      nextSyncAt: knowledgeBaseConnector.nextSyncAt,
      lastSyncSummary: knowledgeBaseConnector.lastSyncSummary,
      failedCount: knowledgeBaseConnector.failedCount,
      createdAt: knowledgeBaseConnector.createdAt,
    })
    .from(knowledgeBaseConnector)
    .where(eq(knowledgeBaseConnector.knowledgeBaseId, knowledgeBaseId))
    .orderBy(desc(knowledgeBaseConnector.createdAt))

  // Never leak the stored credential; just say whether one is set.
  return NextResponse.json({
    success: true,
    data: rows,
    availableTypes: Object.values(CONNECTOR_REGISTRY).map((c) => ({
      type: c.type,
      displayName: c.displayName,
      requiresCredential: c.requiresCredential,
    })),
  })
}

// POST /api/knowledge/[id]/connectors — create a connector
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: knowledgeBaseId } = await params
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await checkKnowledgeBaseAccess(knowledgeBaseId, session.user.id)
  if (!access.hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const id = randomUUID()
  const now = new Date()
  await db.insert(knowledgeBaseConnector).values({
    id,
    knowledgeBaseId,
    type: body.type,
    name: body.name,
    config: body.config,
    credential: body.credential ?? null,
    frequency: body.frequency,
    status: 'active',
    enabled: true,
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  })

  logger.info(`Created ${body.type} connector ${id} for KB ${knowledgeBaseId}`)
  return NextResponse.json({ success: true, data: { id } }, { status: 201 })
}
