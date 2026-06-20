import type { ToolResponse } from '@/tools/types'

export interface GoogleBigQueryBaseParams {
  accessToken: string
  projectId: string
}

export interface GoogleBigQueryQueryParams extends GoogleBigQueryBaseParams {
  query: string
}

export interface GoogleBigQueryListDatasetsParams extends GoogleBigQueryBaseParams {
  maxResults?: number
}

export interface GoogleBigQueryListTablesParams extends GoogleBigQueryBaseParams {
  datasetId: string
  maxResults?: number
}

export interface GoogleBigQueryObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { jobComplete?: boolean; totalRows?: string }
  }
}

export interface GoogleBigQueryListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken?: string }
  }
}

export type GoogleBigQueryResponse = GoogleBigQueryObjectResponse | GoogleBigQueryListResponse
