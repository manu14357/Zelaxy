import type { ToolResponse } from '@/tools/types'

export interface PersonaBaseParams {
  apiKey: string
}

export interface PersonaListInquiriesParams extends PersonaBaseParams {
  status?: string
  limit?: number
}

export interface PersonaGetInquiryParams extends PersonaBaseParams {
  id: string
}

export interface PersonaGetAccountParams extends PersonaBaseParams {
  id: string
}

export interface PersonaObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; type?: string }
  }
}

export interface PersonaListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type PersonaResponse = PersonaObjectResponse | PersonaListResponse
