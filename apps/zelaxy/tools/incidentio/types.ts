import type { ToolResponse } from '@/tools/types'

export interface IncidentioBaseParams {
  apiKey: string
}

export interface ListIncidentsParams extends IncidentioBaseParams {
  pageSize?: number
}

export interface CreateIncidentParams extends IncidentioBaseParams {
  name: string
  idempotencyKey?: string
}

export interface GetIncidentParams extends IncidentioBaseParams {
  incidentId: string
}

export interface IncidentioObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; reference?: string }
  }
}

export interface IncidentioListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; after?: string }
  }
}

export type IncidentioResponse = IncidentioObjectResponse | IncidentioListResponse
