import type { ToolResponse } from '@/tools/types'

export interface ZoomInfoBaseParams {
  apiKey: string
}

export interface EnrichContactParams extends ZoomInfoBaseParams {
  matchPersonInput: Record<string, any>[]
  outputFields?: string[]
}

export interface EnrichCompanyParams extends ZoomInfoBaseParams {
  matchCompanyInput: Record<string, any>[]
  outputFields?: string[]
}

export interface SearchContactParams extends ZoomInfoBaseParams {
  firstName?: string
  lastName?: string
  jobTitle?: string
  companyName?: string
  rpp?: number
}

export interface ZoomInfoObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { count: number }
  }
}

export type ZoomInfoResponse = ZoomInfoObjectResponse
