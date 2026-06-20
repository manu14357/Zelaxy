import type { ToolResponse } from '@/tools/types'

export interface LaunchDarklyBaseParams {
  apiKey: string
}

export interface ListFlagsParams extends LaunchDarklyBaseParams {
  projectKey?: string
}

export interface GetFlagParams extends LaunchDarklyBaseParams {
  projectKey?: string
  flagKey: string
}

export interface ListProjectsParams extends LaunchDarklyBaseParams {}

export interface LaunchDarklyObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { key?: string; name?: string }
  }
}

export interface LaunchDarklyListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; totalCount?: number }
  }
}

export type LaunchDarklyResponse = LaunchDarklyObjectResponse | LaunchDarklyListResponse
