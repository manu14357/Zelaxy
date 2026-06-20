import type { ToolResponse } from '@/tools/types'

export interface FirefliesBaseParams {
  apiKey: string
}

export interface FirefliesListTranscriptsParams extends FirefliesBaseParams {
  limit?: number
}

export interface FirefliesGetTranscriptParams extends FirefliesBaseParams {
  transcriptId: string
}

export interface FirefliesGetUserParams extends FirefliesBaseParams {
  userId?: string
}

export interface FirefliesObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface FirefliesListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type FirefliesResponse = FirefliesObjectResponse | FirefliesListResponse
