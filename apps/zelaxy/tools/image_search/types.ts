/**
 * Image Search Tool - Types
 */

import type { ToolResponse } from '@/tools/types'

// ==========================================
// Search Result Types
// ==========================================

export interface ImageSearchResult {
  id: string
  documentId: string
  filename: string
  filePath: string
  fileUrl?: string
  thumbnailUrl?: string
  content: string
  extractedText: string
  similarity: number
  score: number
  chunkIndex: number
  metadata: Record<string, any>
  tags?: Record<string, string>
  spatialData?: Record<string, any>
}

// ==========================================
// Tool Responses
// ==========================================

export interface ImageSearchResponse extends ToolResponse {
  success: boolean
  output: {
    results: ImageSearchResult[]
    query?: string
    mode: string
    totalResults: number
  }
}

export interface ImageCatalogResponse extends ToolResponse {
  success: boolean
  output: {
    catalogId: string
    name: string
    message: string
  }
}

export interface ImageIngestResponse extends ToolResponse {
  success: boolean
  output: {
    catalogId: string
    totalDiscovered: number
    processed: number
    failed: number
    errors: Array<{ filename: string; error: string }>
    message: string
  }
}

export interface ImageStatusResponse extends ToolResponse {
  success: boolean
  output: {
    catalogId: string
    name: string
    status: string
    fileCount: number
    documentCount: number
    indexingProgress: number
    lastIndexedAt: string | null
    indexingError: string | null
    dataSource: string
    processingMode: string
  }
}
