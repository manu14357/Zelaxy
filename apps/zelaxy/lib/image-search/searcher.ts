/**
 * Image Search Engine
 *
 * Implements 4 search algorithms with hybrid ranking:
 *   1. Keyword search — full-text search on tsvector with ts_rank
 *   2. Visual similarity — CLIP embedding cosine distance via pgvector
 *   3. Metadata/tag filtering — tag columns + JSONB metadata queries
 *   4. Spatial search — JSONB queries on spatial_data column
 *
 * Uses Reciprocal Rank Fusion (RRF) to combine results from multiple algorithms.
 */

import { sql } from 'drizzle-orm'
import { buildSpatialSQLConditions, matchesSpatialFilters } from './spatial-extractor'
import type { SearchFilters, SearchQuery, SearchResponse, SearchResult } from './types'

// ==========================================
// Constants
// ==========================================

const RRF_K = 60 // RRF smoothing constant

// ==========================================
// Search Execution
// ==========================================

/**
 * Execute a search query against an image catalog.
 * Routes to the appropriate search strategy based on mode.
 */
export async function executeSearch(
  query: SearchQuery,
  db: any, // Drizzle db instance
  generateEmbedding?: (text: string) => Promise<number[]>
): Promise<SearchResponse> {
  const startTime = Date.now()

  let results: SearchResult[] = []

  switch (query.mode) {
    case 'keyword':
      results = await keywordSearch(query, db)
      break

    case 'visual':
      if (!generateEmbedding) {
        throw new Error('Embedding generator required for visual search')
      }
      results = await visualSearch(query, db, generateEmbedding)
      break

    case 'hybrid':
      results = await hybridSearch(query, db, generateEmbedding)
      break

    case 'spatial':
      results = await spatialSearch(query, db)
      break

    default:
      results = await hybridSearch(query, db, generateEmbedding)
  }

  // Apply post-filters (spatial filters work as post-filter for non-spatial modes)
  if (query.spatialFilters && query.mode !== 'spatial') {
    results = results.filter((r) => matchesSpatialFilters(r.spatialData, query.spatialFilters!))
  }

  return {
    results: results.slice(0, query.topK),
    totalFound: results.length,
    searchTimeMs: Date.now() - startTime,
    searchMode: query.mode,
    query: query.query,
  }
}

// ==========================================
// Keyword Search (Full-Text via tsvector)
// ==========================================

async function keywordSearch(query: SearchQuery, db: any): Promise<SearchResult[]> {
  if (!query.query) return []

  const catalogIds = query.catalogIds
  const searchQuery = query.query
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0)
    .join(' & ')

  if (!searchQuery) return []

  const tagConditions = buildTagConditions(query.filters)
  const tagWhere = tagConditions.length > 0 ? `AND ${tagConditions.join(' AND ')}` : ''

  const catalogIdsStr = catalogIds.map((id) => `'${id}'`).join(',')

  const rawResults = await db.execute(
    sql.raw(`
    SELECT
      e.id as embedding_id,
      e.document_id,
      e.content,
      e.chunk_index,
      ts_rank(e.content_tsv, to_tsquery('english', '${searchQuery}')) as rank,
      d.filename,
      d.file_path,
      d.file_url,
      d.thumbnail_url,
      d.file_type,
      d.extracted_text,
      d.metadata,
      d.spatial_data,
      d.tag1, d.tag2, d.tag3, d.tag4, d.tag5, d.tag6, d.tag7
    FROM image_embedding e
    JOIN image_document d ON e.document_id = d.id
    WHERE e.catalog_id IN (${catalogIdsStr})
      AND e.enabled = true
      AND d.enabled = true
      AND d.deleted_at IS NULL
      AND e.content_tsv @@ to_tsquery('english', '${searchQuery}')
      ${tagWhere}
    ORDER BY rank DESC
    LIMIT ${query.topK * 3}
  `)
  )

  return deduplicateAndMapResults(rawResults.rows || [], 'keyword')
}

// ==========================================
// Visual Search (CLIP Embedding Similarity)
// ==========================================

async function visualSearch(
  query: SearchQuery,
  db: any,
  generateEmbedding?: (text: string) => Promise<number[]>
): Promise<SearchResult[]> {
  if (!generateEmbedding) return []

  // Generate query embedding (either from text or image description)
  const queryText = query.query || query.imageUrl || ''
  if (!queryText) return []

  const queryEmbedding = await generateEmbedding(queryText)

  // Pad/truncate to 2000 dimensions
  const normalizedEmbedding = normalizeEmbeddingDimensions(queryEmbedding, 2000)
  const embeddingStr = `[${normalizedEmbedding.join(',')}]`

  const catalogIdsStr = query.catalogIds.map((id) => `'${id}'`).join(',')
  const tagConditions = buildTagConditions(query.filters)
  const tagWhere = tagConditions.length > 0 ? `AND ${tagConditions.join(' AND ')}` : ''

  const rawResults = await db.execute(
    sql.raw(`
    SELECT
      e.id as embedding_id,
      e.document_id,
      e.content,
      e.chunk_index,
      1 - (e.embedding <=> '${embeddingStr}'::vector) as similarity,
      d.filename,
      d.file_path,
      d.file_url,
      d.thumbnail_url,
      d.file_type,
      d.extracted_text,
      d.metadata,
      d.spatial_data,
      d.tag1, d.tag2, d.tag3, d.tag4, d.tag5, d.tag6, d.tag7
    FROM image_embedding e
    JOIN image_document d ON e.document_id = d.id
    WHERE e.catalog_id IN (${catalogIdsStr})
      AND e.enabled = true
      AND d.enabled = true
      AND d.deleted_at IS NULL
      AND e.embedding IS NOT NULL
      ${tagWhere}
    ORDER BY e.embedding <=> '${embeddingStr}'::vector ASC
    LIMIT ${query.topK * 3}
  `)
  )

  return deduplicateAndMapResults(rawResults.rows || [], 'visual')
}

// ==========================================
// Hybrid Search (Keyword + Visual with RRF)
// ==========================================

async function hybridSearch(
  query: SearchQuery,
  db: any,
  generateEmbedding?: (text: string) => Promise<number[]>
): Promise<SearchResult[]> {
  // Run keyword and visual searches in parallel
  const [keywordResults, visualResults] = await Promise.all([
    query.query ? keywordSearch(query, db) : Promise.resolve([]),
    generateEmbedding && (query.query || query.imageUrl)
      ? visualSearch(query, db, generateEmbedding)
      : Promise.resolve([]),
  ])

  // Reciprocal Rank Fusion
  const fusedScores = new Map<string, { score: number; result: SearchResult }>()

  // Add keyword scores
  keywordResults.forEach((result, rank) => {
    const key = result.documentId
    const existing = fusedScores.get(key)
    const rrfScore = 1 / (RRF_K + rank + 1)

    if (existing) {
      existing.score += rrfScore
      existing.result.rankingDetails = {
        ...existing.result.rankingDetails,
        keywordScore: result.similarity,
        fusedScore: existing.score,
      }
    } else {
      fusedScores.set(key, {
        score: rrfScore,
        result: {
          ...result,
          rankingDetails: {
            keywordScore: result.similarity,
            fusedScore: rrfScore,
          },
        },
      })
    }
  })

  // Add visual scores
  visualResults.forEach((result, rank) => {
    const key = result.documentId
    const existing = fusedScores.get(key)
    const rrfScore = 1 / (RRF_K + rank + 1)

    if (existing) {
      existing.score += rrfScore
      existing.result.rankingDetails = {
        ...existing.result.rankingDetails,
        visualScore: result.similarity,
        fusedScore: existing.score,
      }
    } else {
      fusedScores.set(key, {
        score: rrfScore,
        result: {
          ...result,
          rankingDetails: {
            visualScore: result.similarity,
            fusedScore: rrfScore,
          },
        },
      })
    }
  })

  // Sort by fused score
  const sorted = Array.from(fusedScores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ result, score }) => ({
      ...result,
      similarity: score,
    }))

  return sorted
}

// ==========================================
// Spatial Search
// ==========================================

async function spatialSearch(query: SearchQuery, db: any): Promise<SearchResult[]> {
  const catalogIdsStr = query.catalogIds.map((id) => `'${id}'`).join(',')
  const tagConditions = buildTagConditions(query.filters)
  const spatialConditions = query.spatialFilters
    ? buildSpatialSQLConditions(query.spatialFilters)
    : []

  const allConditions = [...tagConditions, ...spatialConditions]
  const whereClause = allConditions.length > 0 ? `AND ${allConditions.join(' AND ')}` : ''

  // If there's a text query, combine with keyword search
  let keywordJoin = ''
  let keywordSelect = '1.0 as similarity'
  let orderBy = 'd.updated_at DESC'

  if (query.query) {
    const searchQuery = query.query
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter((w) => w.length > 0)
      .join(' & ')

    if (searchQuery) {
      keywordSelect = `COALESCE(ts_rank(e.content_tsv, to_tsquery('english', '${searchQuery}')), 0) as similarity`
      keywordJoin = `AND e.content_tsv @@ to_tsquery('english', '${searchQuery}')`
      orderBy = 'similarity DESC'
    }
  }

  const rawResults = await db.execute(
    sql.raw(`
    SELECT DISTINCT ON (d.id)
      d.id as document_id,
      d.filename,
      d.file_path,
      d.file_url,
      d.thumbnail_url,
      d.file_type,
      d.extracted_text,
      d.metadata,
      d.spatial_data,
      d.tag1, d.tag2, d.tag3, d.tag4, d.tag5, d.tag6, d.tag7,
      ${keywordSelect}
    FROM image_document d
    LEFT JOIN image_embedding e ON e.document_id = d.id
    WHERE d.catalog_id IN (${catalogIdsStr})
      AND d.enabled = true
      AND d.deleted_at IS NULL
      ${whereClause}
      ${keywordJoin}
    ORDER BY d.id, ${orderBy}
    LIMIT ${query.topK * 3}
  `)
  )

  return (rawResults.rows || []).map((row: any) => ({
    documentId: row.document_id,
    filename: row.filename,
    filePath: row.file_path,
    fileUrl: row.file_url,
    thumbnailUrl: row.thumbnail_url,
    fileType: row.file_type,
    similarity: Number.parseFloat(row.similarity) || 0,
    matchedContent: '',
    extractedText: row.extracted_text,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
    spatialData:
      typeof row.spatial_data === 'string'
        ? JSON.parse(row.spatial_data)
        : row.spatial_data || null,
    tags: extractTags(row),
    rankingDetails: {
      spatialScore: 1.0,
      fusedScore: Number.parseFloat(row.similarity) || 0,
    },
  }))
}

// ==========================================
// Helpers
// ==========================================

function buildTagConditions(filters?: SearchFilters): string[] {
  const conditions: string[] = []
  if (!filters) return conditions

  if (filters.fileType && filters.fileType.length > 0) {
    const types = filters.fileType.map((t) => `'${t}'`).join(',')
    conditions.push(`d.file_type IN (${types})`)
  }

  if (filters.tags) {
    // Tag filtering needs to map display names to tag slots
    // For now, we support direct tag slot filtering (tag1-tag7)
    for (const [key, value] of Object.entries(filters.tags)) {
      if (key.startsWith('tag') && /^tag[1-7]$/.test(key)) {
        conditions.push(`d.${key} = '${value.replace(/'/g, "''")}'`)
      }
    }
  }

  if (filters.dateRange) {
    if (filters.dateRange.from) {
      conditions.push(`d.created_at >= '${filters.dateRange.from}'`)
    }
    if (filters.dateRange.to) {
      conditions.push(`d.created_at <= '${filters.dateRange.to}'`)
    }
  }

  if (filters.extractionMethod && filters.extractionMethod.length > 0) {
    const methods = filters.extractionMethod.map((m) => `'${m}'`).join(',')
    conditions.push(`d.extraction_method IN (${methods})`)
  }

  return conditions
}

function normalizeEmbeddingDimensions(embedding: number[], targetDim: number): number[] {
  if (embedding.length === targetDim) return embedding
  if (embedding.length > targetDim) return embedding.slice(0, targetDim)
  // Pad with zeros
  return [...embedding, ...new Array(targetDim - embedding.length).fill(0)]
}

function deduplicateAndMapResults(rows: any[], source: 'keyword' | 'visual'): SearchResult[] {
  const seen = new Map<string, SearchResult>()

  for (const row of rows) {
    const docId = row.document_id
    if (seen.has(docId)) {
      // Keep the higher scoring one
      const existing = seen.get(docId)!
      const newScore = Number.parseFloat(source === 'keyword' ? row.rank : row.similarity) || 0
      if (newScore > existing.similarity) {
        seen.set(docId, mapRowToResult(row, source))
      }
    } else {
      seen.set(docId, mapRowToResult(row, source))
    }
  }

  return Array.from(seen.values())
}

function mapRowToResult(row: any, source: 'keyword' | 'visual'): SearchResult {
  return {
    documentId: row.document_id,
    filename: row.filename,
    filePath: row.file_path,
    fileUrl: row.file_url,
    thumbnailUrl: row.thumbnail_url,
    fileType: row.file_type,
    similarity: Number.parseFloat(source === 'keyword' ? row.rank : row.similarity) || 0,
    matchedContent: row.content || '',
    extractedText: row.extracted_text,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
    spatialData:
      typeof row.spatial_data === 'string'
        ? JSON.parse(row.spatial_data)
        : row.spatial_data || null,
    tags: extractTags(row),
  }
}

function extractTags(row: any): Record<string, string> {
  const tags: Record<string, string> = {}
  for (let i = 1; i <= 7; i++) {
    const val = row[`tag${i}`]
    if (val) tags[`tag${i}`] = val
  }
  return tags
}
