import type { ToolResponse } from '@/tools/types'

export interface SimilarwebBaseParams {
  apiKey: string
  domain: string
}

export interface TotalTrafficParams extends SimilarwebBaseParams {}

export interface WebsiteRankParams extends SimilarwebBaseParams {}

export interface SimilarwebObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { domain: string }
  }
}

export type SimilarwebResponse = SimilarwebObjectResponse
