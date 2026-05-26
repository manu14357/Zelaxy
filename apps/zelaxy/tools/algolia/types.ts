import type { ToolResponse } from '@/tools/types'

interface AlgoliaBaseParams {
  applicationId: string
  apiKey: string
}

export interface AlgoliaSearchParams extends AlgoliaBaseParams {
  indexName: string
  query: string
  hitsPerPage?: number | string
  page?: number | string
  filters?: string
  attributesToRetrieve?: string
}

export interface AlgoliaSearchResponse extends ToolResponse {
  output: {
    hits: Record<string, unknown>[]
    nbHits: number
    page: number
    nbPages: number
    hitsPerPage: number
    processingTimeMS: number
    query: string
    parsedQuery: string | null
    facets: Record<string, Record<string, number>> | null
    facets_stats: Record<string, { min: number; max: number; avg: number; sum: number }> | null
    exhaustive: Record<string, boolean> | null
  }
}

export interface AlgoliaIndexDocumentParams extends AlgoliaBaseParams {
  indexName: string
  objectID?: string
  record: string | Record<string, unknown>
}

export interface AlgoliaIndexDocumentResponse extends ToolResponse {
  output: {
    taskID: number
    objectID: string
    createdAt: string | null
    updatedAt: string | null
  }
}

export interface AlgoliaUpdateDocumentParams extends AlgoliaBaseParams {
  indexName: string
  objectID: string
  attributes: string | Record<string, unknown>
  createIfNotExists?: boolean
}

export interface AlgoliaUpdateDocumentResponse extends ToolResponse {
  output: {
    taskID: number
    objectID: string
    updatedAt: string | null
  }
}

export interface AlgoliaDeleteDocumentParams extends AlgoliaBaseParams {
  indexName: string
  objectID: string
}

export interface AlgoliaDeleteDocumentResponse extends ToolResponse {
  output: {
    taskID: number
    deletedAt: string | null
  }
}

export interface AlgoliaGetDocumentParams extends AlgoliaBaseParams {
  indexName: string
  objectID: string
  attributesToRetrieve?: string
}

export interface AlgoliaGetDocumentResponse extends ToolResponse {
  output: {
    objectID: string
    record: Record<string, unknown>
  }
}
