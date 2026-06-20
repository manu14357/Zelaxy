import type { ToolResponse } from '@/tools/types'

export interface GoogleBooksBaseParams {
  apiKey: string
}

export interface SearchVolumesParams extends GoogleBooksBaseParams {
  q: string
  maxResults?: number
}

export interface GetVolumeParams extends GoogleBooksBaseParams {
  volumeId: string
}

export interface GoogleBooksObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface GoogleBooksListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { totalItems: number; count: number }
  }
}

export type GoogleBooksResponse = GoogleBooksObjectResponse | GoogleBooksListResponse
