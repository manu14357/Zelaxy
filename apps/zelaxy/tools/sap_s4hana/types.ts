import type { ToolResponse } from '@/tools/types'

export interface SapS4HanaBaseParams {
  baseUrl: string
  username: string
  password: string
}

export interface GetBusinessPartnersParams extends SapS4HanaBaseParams {
  filter?: string
  top?: number
  skip?: number
  select?: string
}

export interface GetBusinessPartnerParams extends SapS4HanaBaseParams {
  businessPartner: string
  select?: string
}

export interface ListProductsParams extends SapS4HanaBaseParams {
  filter?: string
  top?: number
  skip?: number
  select?: string
}

export interface SapS4HanaResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status: number; count?: number }
  }
}
