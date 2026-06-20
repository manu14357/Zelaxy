import type { ToolResponse } from '@/tools/types'

export interface VantaBaseParams {
  apiKey: string
}

export interface VantaListTestsParams extends VantaBaseParams {
  statusFilter?: string
  frameworkFilter?: string
  integrationFilter?: string
  pageSize?: number
  pageCursor?: string
}

export interface VantaListControlsParams extends VantaBaseParams {
  frameworkMatchesAny?: string
  pageSize?: number
  pageCursor?: string
}

export interface VantaListVendorsParams extends VantaBaseParams {
  name?: string
  statusMatchesAny?: string
  pageSize?: number
  pageCursor?: string
}

export interface VantaListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; pageInfo: Record<string, any> | null }
  }
}

export type VantaResponse = VantaListResponse
