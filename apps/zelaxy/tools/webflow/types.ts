import type { ToolResponse } from '@/tools/types'

export interface WebflowBaseParams {
  apiKey: string
}

export interface ListSitesParams extends WebflowBaseParams {}

export interface ListCollectionsParams extends WebflowBaseParams {
  site_id: string
}

export interface ListCollectionItemsParams extends WebflowBaseParams {
  collection_id: string
}

export interface CreateCollectionItemParams extends WebflowBaseParams {
  collection_id: string
  fieldData: Record<string, any>
}

export interface WebflowObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface WebflowListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type WebflowResponse = WebflowObjectResponse | WebflowListResponse
