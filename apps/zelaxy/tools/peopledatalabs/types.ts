import type { ToolResponse } from '@/tools/types'

export interface PeopleDataLabsBaseParams {
  apiKey: string
}

export interface PersonEnrichParams extends PeopleDataLabsBaseParams {
  email?: string
  name?: string
  company?: string
  min_likelihood?: number
}

export interface CompanyEnrichParams extends PeopleDataLabsBaseParams {
  name?: string
  website?: string
  ticker?: string
}

export interface PersonSearchParams extends PeopleDataLabsBaseParams {
  query?: Record<string, any>
  sql?: string
  size?: number
}

export interface PeopleDataLabsObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status: number; likelihood?: number }
  }
}

export interface PeopleDataLabsListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { status: number; total: number }
  }
}

export type PeopleDataLabsResponse = PeopleDataLabsObjectResponse | PeopleDataLabsListResponse
