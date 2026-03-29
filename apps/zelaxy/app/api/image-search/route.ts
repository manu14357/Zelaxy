/**
 * Image Search API — Catalog & Ingest & Search
 *
 * POST /api/image-search — Handles all image search operations
 *   - action: 'create_catalog' | 'ingest' | 'search' | 'status'
 */

import crypto from 'crypto'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { discoverFiles } from '@/lib/image-search/connectors'
import {
  type ProcessingConfig,
  prepareChunksForEmbedding,
  processFile,
} from '@/lib/image-search/indexer'
import { executeSearch } from '@/lib/image-search/searcher'
import type {
  ConnectionConfig,
  DataSourceType,
  ExtractionMethod,
  ProcessingMode,
  SearchQuery,
} from '@/lib/image-search/types'
import { db } from '@/db'
import { imageCatalog, imageDocument, imageEmbedding } from '@/db/schema'

// ==========================================
// POST Handler
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_catalog':
        return handleCreateCatalog(body)
      case 'ingest':
        return handleIngest(body)
      case 'search':
        return handleSearch(body)
      case 'status':
        return handleStatus(body)
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Image Search API Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// ==========================================
// Create Catalog
// ==========================================

async function handleCreateCatalog(body: {
  name: string
  description?: string
  userId: string
  workspaceId?: string
  embeddingModel?: string
  processingMode?: ProcessingMode
  extractionMethod?: ExtractionMethod
  dataSource?: DataSourceType
  connectionConfig?: ConnectionConfig
}) {
  const catalogId = crypto.randomUUID()

  await db.insert(imageCatalog).values({
    id: catalogId,
    userId: body.userId,
    workspaceId: body.workspaceId,
    name: body.name,
    description: body.description || null,
    embeddingModel: body.embeddingModel || 'text-embedding-3-small',
    embeddingDimension: body.embeddingModel?.includes('nomic') ? 768 : 1536,
    processingMode: body.processingMode || 'batch',
    extractionMethod: body.extractionMethod || 'auto',
    dataSource: body.dataSource || 'upload',
    connectionConfig: body.connectionConfig || {},
    status: 'active',
  })

  return NextResponse.json({
    success: true,
    output: {
      catalogId,
      name: body.name,
      message: `Catalog "${body.name}" created successfully`,
    },
  })
}

// ==========================================
// Ingest Files
// ==========================================

async function handleIngest(body: {
  catalogId: string
  dataSource: DataSourceType
  connectionConfig?: ConnectionConfig
  uploadedFiles?: Array<{ path: string; name: string; size?: number }>
  extractionMethod?: ExtractionMethod
  apiKey?: string
  mistralApiKey?: string
  visionModel?: string
  apsClientId?: string
  apsClientSecret?: string
  userId: string
}) {
  const { catalogId, dataSource } = body

  // Verify catalog exists
  const catalog = await db
    .select()
    .from(imageCatalog)
    .where(and(eq(imageCatalog.id, catalogId), isNull(imageCatalog.deletedAt)))
    .limit(1)

  if (catalog.length === 0) {
    return NextResponse.json({ success: false, error: 'Catalog not found' }, { status: 404 })
  }

  // Update catalog status
  await db
    .update(imageCatalog)
    .set({ status: 'indexing', indexingProgress: 0 })
    .where(eq(imageCatalog.id, catalogId))

  try {
    // Step 1: Discover files
    const discoveryResult = await discoverFiles(
      dataSource,
      body.connectionConfig || ({} as ConnectionConfig),
      body.uploadedFiles
    )

    if (discoveryResult.files.length === 0) {
      await db
        .update(imageCatalog)
        .set({ status: 'active', indexingProgress: 100 })
        .where(eq(imageCatalog.id, catalogId))

      return NextResponse.json({
        success: true,
        output: {
          message: 'No supported files found',
          totalFound: 0,
          errors: discoveryResult.errors,
        },
      })
    }

    // Step 2: Process each file
    const processingConfig: ProcessingConfig = {
      extractionMethod: body.extractionMethod || catalog[0].extractionMethod || 'auto',
      apiKey: body.apiKey,
      visionModel: body.visionModel || 'gpt-4o',
      mistralApiKey: body.mistralApiKey,
      apsClientId: body.apsClientId,
      apsClientSecret: body.apsClientSecret,
    }

    let processedCount = 0
    let failedCount = 0
    const errors: Array<{ filename: string; error: string }> = []

    for (const file of discoveryResult.files) {
      try {
        // Process the file
        const result = await processFile(file, processingConfig)

        if (result.error) {
          failedCount++
          errors.push({ filename: file.filename, error: result.error })
          continue
        }

        // Insert document record
        const docId = result.documentId
        await db.insert(imageDocument).values({
          id: docId,
          catalogId,
          filename: file.filename,
          filePath: file.filePath,
          fileUrl: file.filePath.startsWith('http') ? file.filePath : null,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          fileType: file.fileType,
          thumbnailUrl: result.thumbnailUrl,
          processingStatus: 'completed',
          processingStartedAt: new Date(),
          processingCompletedAt: new Date(),
          extractionMethod: result.extractionMethod,
          extractedText: result.extractedText,
          extractedTextLength: result.textLength,
          metadata: result.metadata,
          spatialData: result.spatialData || {},
        })

        // Step 3: Generate embeddings for text chunks
        if (result.extractedText && result.extractedText.length > 0) {
          const chunks = prepareChunksForEmbedding(result)

          for (const chunk of chunks) {
            // Generate embedding via existing knowledge base embedding infrastructure
            let embeddingVector: number[] | null = null
            try {
              const embResponse = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/image-search/embed`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: chunk.content,
                    model: catalog[0].embeddingModel,
                    apiKey: body.apiKey,
                  }),
                }
              )
              if (embResponse.ok) {
                const embResult = (await embResponse.json()) as { embedding: number[] }
                embeddingVector = embResult.embedding
              }
            } catch {
              // Embedding generation failed — insert without vector
            }

            // Pad to 2000 dimensions
            const normalizedEmbedding = embeddingVector ? padEmbedding(embeddingVector, 2000) : null

            const embeddingId = crypto.randomUUID()
            await db.insert(imageEmbedding).values({
              id: embeddingId,
              catalogId,
              documentId: docId,
              embeddingType: 'text',
              chunkIndex: chunk.chunkIndex,
              chunkHash: chunk.chunkHash,
              content: chunk.content,
              contentLength: chunk.content.length,
              tokenCount: Math.ceil(chunk.content.length / 4), // rough estimate
              embedding: normalizedEmbedding,
              embeddingModel: catalog[0].embeddingModel,
              startOffset: chunk.startOffset,
              endOffset: chunk.endOffset,
            })
          }
        }

        processedCount++

        // Update progress
        const progress = Math.round(
          ((processedCount + failedCount) / discoveryResult.files.length) * 100
        )
        await db
          .update(imageCatalog)
          .set({ indexingProgress: progress })
          .where(eq(imageCatalog.id, catalogId))
      } catch (error) {
        failedCount++
        errors.push({
          filename: file.filename,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Update catalog stats and status
    await db
      .update(imageCatalog)
      .set({
        status: 'active',
        indexingProgress: 100,
        lastIndexedAt: new Date(),
        fileCount: sql`${imageCatalog.fileCount} + ${processedCount}`,
      })
      .where(eq(imageCatalog.id, catalogId))

    return NextResponse.json({
      success: true,
      output: {
        catalogId,
        totalDiscovered: discoveryResult.files.length,
        processed: processedCount,
        failed: failedCount,
        errors: [...discoveryResult.errors, ...errors],
        message: `Successfully indexed ${processedCount} files (${failedCount} failed)`,
      },
    })
  } catch (error) {
    // Reset catalog status on failure
    await db
      .update(imageCatalog)
      .set({
        status: 'error',
        indexingError: error instanceof Error ? error.message : String(error),
      })
      .where(eq(imageCatalog.id, catalogId))

    throw error
  }
}

// ==========================================
// Search
// ==========================================

async function handleSearch(body: {
  catalogIds: string[]
  query?: string
  imageUrl?: string
  mode?: string
  topK?: number
  filters?: any
  spatialFilters?: any
  apiKey?: string
}) {
  const searchQuery: SearchQuery = {
    catalogIds: body.catalogIds,
    query: body.query,
    imageUrl: body.imageUrl,
    mode: (body.mode as SearchQuery['mode']) || 'hybrid',
    topK: Math.max(1, Math.min(100, body.topK || 10)),
    filters: body.filters,
    spatialFilters: body.spatialFilters,
  }

  // Create embedding generator function
  const generateEmbedding = body.apiKey
    ? async (text: string): Promise<number[]> => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/image-search/embed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, apiKey: body.apiKey }),
          }
        )
        if (!response.ok) throw new Error('Embedding generation failed')
        const result = (await response.json()) as { embedding: number[] }
        return result.embedding
      }
    : undefined

  const searchResponse = await executeSearch(searchQuery, db, generateEmbedding)

  return NextResponse.json({
    success: true,
    output: searchResponse,
  })
}

// ==========================================
// Status
// ==========================================

async function handleStatus(body: { catalogId: string }) {
  const catalog = await db
    .select()
    .from(imageCatalog)
    .where(and(eq(imageCatalog.id, body.catalogId), isNull(imageCatalog.deletedAt)))
    .limit(1)

  if (catalog.length === 0) {
    return NextResponse.json({ success: false, error: 'Catalog not found' }, { status: 404 })
  }

  const c = catalog[0]

  // Count documents
  const docs = await db
    .select({ count: sql<number>`count(*)` })
    .from(imageDocument)
    .where(and(eq(imageDocument.catalogId, c.id), isNull(imageDocument.deletedAt)))

  return NextResponse.json({
    success: true,
    output: {
      catalogId: c.id,
      name: c.name,
      status: c.status,
      fileCount: c.fileCount,
      documentCount: docs[0]?.count || 0,
      indexingProgress: c.indexingProgress,
      lastIndexedAt: c.lastIndexedAt,
      indexingError: c.indexingError,
      dataSource: c.dataSource,
      processingMode: c.processingMode,
    },
  })
}

// ==========================================
// Helpers
// ==========================================

function padEmbedding(embedding: number[], targetDim: number): number[] {
  if (embedding.length >= targetDim) return embedding.slice(0, targetDim)
  return [...embedding, ...new Array(targetDim - embedding.length).fill(0)]
}
