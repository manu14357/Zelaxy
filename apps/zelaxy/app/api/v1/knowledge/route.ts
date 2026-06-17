import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import {
  checkRateLimit,
  createRateLimitResponse,
  validateWorkspaceAccess,
} from '@/app/api/v1/middleware'
import { db } from '@/db'
import { document, knowledgeBase } from '@/db/schema'

const logger = createLogger('V1KnowledgeAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

const QuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

const CreateSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  name: z.string().min(1, 'name is required').max(255),
  description: z.string().max(1000).optional(),
  embeddingModel: z.string().optional().default('text-embedding-3-small'),
})

/** GET /api/v1/knowledge — List knowledge bases in a workspace. */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'knowledge')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!
    const { searchParams } = new URL(request.url)
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { workspaceId, limit, offset } = parsed.data

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId)
    if (accessError) return accessError

    // Fetch KBs with document count in one query
    const rows = await db
      .select({
        id: knowledgeBase.id,
        name: knowledgeBase.name,
        description: knowledgeBase.description,
        embeddingModel: knowledgeBase.embeddingModel,
        tokenCount: knowledgeBase.tokenCount,
        createdAt: knowledgeBase.createdAt,
        updatedAt: knowledgeBase.updatedAt,
      })
      .from(knowledgeBase)
      .where(and(eq(knowledgeBase.workspaceId, workspaceId), isNull(knowledgeBase.deletedAt)))
      .orderBy(desc(knowledgeBase.updatedAt))
      .limit(limit)
      .offset(offset)

    // Fetch doc counts for each KB
    const kbIds = rows.map((r) => r.id)
    const docCounts: Record<string, number> = {}
    if (kbIds.length > 0) {
      const counts = await db
        .select({
          knowledgeBaseId: document.knowledgeBaseId,
          docCount: count(document.id),
        })
        .from(document)
        .where(isNull(document.deletedAt))
        .groupBy(document.knowledgeBaseId)
      for (const c of counts) {
        if (kbIds.includes(c.knowledgeBaseId)) {
          docCounts[c.knowledgeBaseId] = Number(c.docCount)
        }
      }
    }

    logger.info(`[${requestId}] Listed ${rows.length} knowledge bases for workspace ${workspaceId}`)

    return NextResponse.json({
      success: true,
      data: {
        knowledgeBases: rows.map((kb) => ({
          ...kb,
          documentCount: docCounts[kb.id] ?? 0,
          createdAt: kb.createdAt.toISOString(),
          updatedAt: kb.updatedAt.toISOString(),
        })),
        totalCount: rows.length,
        limit,
        offset,
      },
    })
  } catch (error) {
    logger.error(`[${requestId}] Error listing knowledge bases`, { error })
    return NextResponse.json({ error: 'Failed to list knowledge bases' }, { status: 500 })
  }
}

/** POST /api/v1/knowledge — Create a knowledge base. */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const rateLimit = await checkRateLimit(request, 'knowledge')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit)
    }

    const userId = rateLimit.userId!

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { workspaceId, name, description, embeddingModel } = parsed.data

    const accessError = await validateWorkspaceAccess(rateLimit, userId, workspaceId, 'write')
    if (accessError) return accessError

    const now = new Date()
    const id = crypto.randomUUID()

    // Embedding model → dimension mapping
    const dimensionMap: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
    }
    const embeddingDimension = dimensionMap[embeddingModel] ?? 1536

    const [kb] = await db
      .insert(knowledgeBase)
      .values({
        id,
        userId,
        workspaceId,
        name,
        description: description ?? null,
        embeddingModel,
        embeddingDimension,
        tokenCount: 0,
        chunkingConfig: { maxSize: 1024, minSize: 1, overlap: 200 },
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    logger.info(`[${requestId}] Created knowledge base ${id} in workspace ${workspaceId}`)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: kb.id,
          name: kb.name,
          description: kb.description,
          embeddingModel: kb.embeddingModel,
          embeddingDimension: kb.embeddingDimension,
          tokenCount: kb.tokenCount,
          workspaceId: kb.workspaceId,
          documentCount: 0,
          createdAt: kb.createdAt.toISOString(),
          updatedAt: kb.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error(`[${requestId}] Error creating knowledge base`, { error })
    return NextResponse.json({ error: 'Failed to create knowledge base' }, { status: 500 })
  }
}
