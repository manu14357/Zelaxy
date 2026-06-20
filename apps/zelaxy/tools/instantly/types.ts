import type { ToolResponse } from '@/tools/types'

export interface InstantlyBaseParams {
  apiKey: string
}

export interface ListCampaignsParams extends InstantlyBaseParams {}

export interface CreateLeadParams extends InstantlyBaseParams {
  campaign: string
  email: string
}

export interface ListLeadsParams extends InstantlyBaseParams {}

export interface InstantlyObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface InstantlyListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type InstantlyResponse = InstantlyObjectResponse | InstantlyListResponse
