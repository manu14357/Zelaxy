import type { ToolResponse } from '@/tools/types'

export interface DropcontactBaseParams {
  apiKey: string
}

export interface EnrichParams extends DropcontactBaseParams {
  email?: string
  first_name?: string
  last_name?: string
  company?: string
  siret?: boolean
}

export interface GetBatchParams extends DropcontactBaseParams {
  request_id: string
}

export interface DropcontactEnrichResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { request_id: string; success: boolean }
  }
}

export interface DropcontactBatchResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { request_id: string; ready: boolean }
  }
}

export type DropcontactResponse = DropcontactEnrichResponse | DropcontactBatchResponse
