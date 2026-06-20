import type { ToolResponse } from '@/tools/types'

export interface PipedriveBaseParams {
  apiKey: string
}

export interface CreateDealParams extends PipedriveBaseParams {
  title: string
  value?: number
  currency?: string
  person_id?: number
  org_id?: number
  stage_id?: number
  status?: string
}

export interface ListDealsParams extends PipedriveBaseParams {
  status?: string
  limit?: number
  start?: number
}

export interface CreatePersonParams extends PipedriveBaseParams {
  name: string
  email?: string
  phone?: string
  org_id?: number
}

export interface SearchDealsParams extends PipedriveBaseParams {
  term: string
  limit?: number
}

export interface PipedriveObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string | number | null }
  }
}

export interface PipedriveListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; has_more: boolean }
  }
}

export type PipedriveResponse = PipedriveObjectResponse | PipedriveListResponse
