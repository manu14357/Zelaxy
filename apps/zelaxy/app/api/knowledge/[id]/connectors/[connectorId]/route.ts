import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { checkKnowledgeBaseAccess } from '@/app/api/knowledge/utils'
import { db } from '@/db'
import { document, embedding, knowledgeBaseConnector } from '@/db/schema'

const logger = createLogger('KnowledgeConnectorAPI')

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.any()).optional(),
  credential: z.string().nullable().optional(),
  frequency: z.enum(['hourly', '6h', 'daily', 'weekly', 'manual']).optional(),
  // Pause / resume / re-enable a disabled connector.
  status: z.enum(['active', 'paused']).optional(),
  enabled: z.boolean().optional(),
})

async function authorize(knowledgeBaseId: string) {
  const session = await getSession()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const access = await checkKnowledgeBaseAccess(knowledgeBaseId, session.user.id)
  if (!access.hasAccess) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: session.user.id }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; connectorId: string }> }
) {
  const { id: knowledgeBaseId, connectorId } = await params
  const auth = await authorize(knowledgeBaseId)
  if (auth.error) return auth.error

  let body: z.infer<typeof UpdateSchema>
  try {
    body = UpdateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined) updateData[k] = v
  }
  // Resuming clears the failure backoff.
  if (body.status === 'active' || body.enabled === true) {
    updateData.failedCount = 0
  }

  const result = await db
    .update(knowledgeBaseConnector)
    .set(updateData)
    .where(
      and(
        eq(knowledgeBaseConnector.id, connectorId),
        eq(knowledgeBaseConnector.knowledgeBaseId, knowledgeBaseId)
      )
    )
    .returning({ id: knowledgeBaseConnector.id })

  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: { id: connectorId } })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; connectorId: string }> }
) {
  const { id: knowledgeBaseId, connectorId } = await params
  const auth = await authorize(knowledgeBaseId)
  if (auth.error) return auth.error

  // ?deleteDocuments=true also removes everything this connector ingested.
  const deleteDocuments = new URL(req.url).searchParams.get('deleteDocuments') === 'true'

  if (deleteDocuments) {
    const docs = await db
      .select({ id: document.id })
      .from(document)
      .where(eq(document.connectorId, connectorId))
    for (const d of docs) {
      await db.delete(embedding).where(eq(embedding.documentId, d.id))
    }
    await db.delete(document).where(eq(document.connectorId, connectorId))
    logger.info(`Deleted ${docs.length} documents from connector ${connectorId}`)
  }

  await db
    .delete(knowledgeBaseConnector)
    .where(
      and(
        eq(knowledgeBaseConnector.id, connectorId),
        eq(knowledgeBaseConnector.knowledgeBaseId, knowledgeBaseId)
      )
    )
  return NextResponse.json({ success: true, deleted: true })
}
