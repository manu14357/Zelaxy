import type { ToolResponse } from '@/tools/types'

export interface ContextDevBaseParams {
  apiKey: string
}

export interface SearchParams extends ContextDevBaseParams {
  query: string
  markdownEnabled?: boolean
}

export interface ScrapeMarkdownParams extends ContextDevBaseParams {
  url: string
  useMainContentOnly?: boolean
  includeLinks?: boolean
}

export interface CrawlParams extends ContextDevBaseParams {
  url: string
  maxPages?: number
  maxDepth?: number
}

export interface ContextDevObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { creditsConsumed: number | null; creditsRemaining: number | null }
  }
}

export interface ContextDevListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { creditsConsumed: number | null; creditsRemaining: number | null }
  }
}

export type ContextDevResponse = ContextDevObjectResponse | ContextDevListResponse
