import type { ToolResponse } from '@/tools/types'

export interface PostHogBaseParams {
  host: string
}

export interface CaptureEventParams extends PostHogBaseParams {
  projectApiKey: string
  event: string
  distinct_id: string
  properties?: Record<string, any>
}

export interface QueryParams extends PostHogBaseParams {
  apiKey: string
  projectId: string
  query: string
}

export interface ListInsightsParams extends PostHogBaseParams {
  apiKey: string
  projectId: string
}

export interface PostHogObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status?: string }
  }
}

export interface PostHogListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type PostHogResponse = PostHogObjectResponse | PostHogListResponse
