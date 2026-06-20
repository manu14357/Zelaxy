import type { ToolResponse } from '@/tools/types'

export interface PagerDutyBaseParams {
  apiKey: string
}

export interface ListIncidentsParams extends PagerDutyBaseParams {
  limit?: number
  statuses?: string
}

export interface CreateIncidentParams extends PagerDutyBaseParams {
  email: string
  title: string
  serviceId: string
}

export interface GetIncidentParams extends PagerDutyBaseParams {
  incidentId: string
}

export interface ListServicesParams extends PagerDutyBaseParams {
  limit?: number
}

export interface PagerDutyObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; status?: string }
  }
}

export interface PagerDutyListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; more?: boolean }
  }
}

export type PagerDutyResponse = PagerDutyObjectResponse | PagerDutyListResponse
