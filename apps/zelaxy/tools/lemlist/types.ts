import type { ToolResponse } from '@/tools/types'

export interface LemlistBaseParams {
  apiKey: string
}

export interface LemlistListCampaignsParams extends LemlistBaseParams {}

export interface LemlistGetCampaignParams extends LemlistBaseParams {
  campaignId: string
}

export interface LemlistAddLeadParams extends LemlistBaseParams {
  campaignId: string
  email: string
  firstName?: string
  lastName?: string
}

export interface LemlistListActivitiesParams extends LemlistBaseParams {}

export interface LemlistObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface LemlistListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type LemlistResponse = LemlistObjectResponse | LemlistListResponse
