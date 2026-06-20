import type { ToolResponse } from '@/tools/types'

export interface RootlyBaseParams {
  apiKey: string
}

export interface ListIncidentsParams extends RootlyBaseParams {
  pageSize?: number
}

export interface CreateIncidentParams extends RootlyBaseParams {
  title: string
  summary?: string
}

export interface GetIncidentParams extends RootlyBaseParams {
  incidentId: string
}

export interface RootlyObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; type?: string }
  }
}

export interface RootlyListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; total?: number }
  }
}

export type RootlyResponse = RootlyObjectResponse | RootlyListResponse
