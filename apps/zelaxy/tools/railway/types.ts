import type { ToolResponse } from '@/tools/types'

export interface RailwayBaseParams {
  apiKey: string
}

export interface RailwayListProjectsParams extends RailwayBaseParams {
  first?: number
}

export interface RailwayGetProjectParams extends RailwayBaseParams {
  projectId: string
}

export interface RailwayListDeploymentsParams extends RailwayBaseParams {
  projectId: string
  serviceId: string
  environmentId: string
  first?: number
}

export interface RailwayObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface RailwayListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type RailwayResponse = RailwayObjectResponse | RailwayListResponse
