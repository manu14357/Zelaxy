import type { ToolResponse } from '@/tools/types'

export interface WizaBaseParams {
  apiKey: string
}

export interface WizaCreateListParams extends WizaBaseParams {
  name: string
  max_profiles?: number
  filters?: Record<string, any>
}

export interface WizaGetListParams extends WizaBaseParams {
  id: string
}

export interface WizaGetContactsParams extends WizaBaseParams {
  id: string
}

export interface WizaRevealIndividualParams extends WizaBaseParams {
  linkedin_url: string
}

export interface WizaObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string | number }
  }
}

export interface WizaListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type WizaResponse = WizaObjectResponse | WizaListResponse
