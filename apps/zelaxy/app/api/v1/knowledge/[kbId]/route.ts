import { and, count, eq, isNull } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { document, knowledgeBase } from '@/db/schema'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'

const logger = createLogger('V1KnowledgeDetailAPI')

export const revalidate = 0

/** GET /api/v1/knowledge/[kbId] — Get knowledge base details. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kbId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { kbId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'knowledge-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    const [kb] = await db
      .select()
      .from(knowledgeBase)
      .where(and(eq(knowledgeBase.id, kbId), isNull(knowledgeBase.deletedAt)))
      .limit(1)

    if (!kb) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    if (kb.workspaceId) {
      const accessError = await validateWorkspaceAccess(rateLimit, userId, kb.workspaceId)
      if (accessError) {
        return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
      }
    } else if (kb.userId !== userId) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    const [{ docCount }] = await db
      .select({ docCount: count(document.id) })
      .from(document)
      .where(and(eq(document.knowledgeBaseId, kbId), isNull(document.deletedAt)))

    logger.info(`[${requestId}] Fetched knowledge base ${kbId}`)

    return NextResponse.json({
      success: true,
      data: {
        id: kb.id,
        name: kb.name,
        description: kb.description,
        embeddingModel: kb.embeddingModel,
        embeddingDimension: kb.embeddingDimension,
        tokenCount: kb.tokenCount,
        chunkingConfig: kb.chunkingConfig,
        workspaceId: kb.workspaceId,
        documentCount: Number(docCount),
        createdAt: kb.createdAt.toISOString(),
        updatedAt: kb.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching knowledge base`, { error })
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 })
  }
}

/** DELETE /api/v1/knowledge/[kbId] — Soft-delete a knowledge base. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ kbId: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { kbId } = await context.params

  try {
    const rateLimit = await checkRateLimit(request, 'knowledge-detail')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    const [kb] = await db
      .select({ id: knowledgeBase.id, workspaceId: knowledgeBase.workspaceId, userId: knowledgeBase.userId, deletedAt: knowledgeBase.deletedAt })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, kbId))
      .limit(1)

    if (!kb || kb.deletedAt) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    if (kb.workspaceId) {
      const accessError = await validateWorkspaceAccess(rateLimit, userId, kb.workspaceId, 'write')
      if (accessError) {
        return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
      }
    } else if (kb.userId !== userId) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    await db
      .update(knowledgeBase)
      .set({ deletedAt: new Date() })
      .where(eq(knowledgeBase.id, kbId))

    logger.info(`[${requestId}] Soft-deleted knowledge base ${kbId}`)

    return NextResponse.json({ success: true, data: { id: kbId, deletedAt: new Date().toISOString() } })
  } catch (error) {
    logger.error(`[${requestId}] Error deleting knowledge base`, { error })
    return NextResponse.json({ error: 'Failed to delete knowledge base' }, { status: 500 })
  }
}
