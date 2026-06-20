import type { ToolResponse } from '@/tools/types'

export interface GoogleAdsBaseParams {
  accessToken: string
  developerToken: string
  customerId: string
  loginCustomerId?: string
}

export interface GoogleAdsSearchParams extends GoogleAdsBaseParams {
  query: string
}

export interface GoogleAdsListCampaignsParams extends GoogleAdsBaseParams {
  limit?: number
}

export interface GoogleAdsResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken?: string | null }
  }
}
