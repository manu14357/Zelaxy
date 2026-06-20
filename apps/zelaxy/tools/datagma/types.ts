import type { ToolResponse } from '@/tools/types'

export interface DatagmaBaseParams {
  apiKey: string
}

export interface EnrichPersonParams extends DatagmaBaseParams {
  firstName?: string
  lastName?: string
  company?: string
}

export interface FindEmailParams extends DatagmaBaseParams {
  firstName?: string
  lastName?: string
  company?: string
}

export interface DatagmaObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { found: boolean }
  }
}

export type DatagmaResponse = DatagmaObjectResponse
