import type { ToolResponse } from '@/tools/types'

export interface BrightDataScrapeUrlParams {
  apiKey: string
  zone: string
  url: string
  format?: string
  country?: string
}

export interface BrightDataScrapeUrlResponse extends ToolResponse {
  output: {
    content: string
    url: string | null
    statusCode: number | null
  }
}

export interface BrightDataSerpSearchParams {
  apiKey: string
  zone: string
  query: string
  searchEngine?: string
  country?: string
  language?: string
  numResults?: number
}

export interface BrightDataSerpSearchResponse extends ToolResponse {
  output: {
    results: Array<{
      title: string | null
      url: string | null
      description: string | null
      rank: number | null
    }>
    query: string | null
    searchEngine: string | null
  }
}

export interface BrightDataDiscoverParams {
  apiKey: string
  query: string
  numResults?: number
  intent?: string
  includeContent?: boolean
  format?: string
  language?: string
  country?: string
}

export interface BrightDataDiscoverResponse extends ToolResponse {
  output: {
    results: Array<{
      url: string | null
      title: string | null
      description: string | null
      relevanceScore: number | null
      content: string | null
    }>
    query: string | null
    totalResults: number
    taskId?: string | null
  }
}
