import type { ToolResponse } from '@/tools/types'

export interface WorkdayBaseParams {
  tenantUrl: string
  accessToken: string
}

export interface WorkdayGetWorkersParams extends WorkdayBaseParams {
  limit?: number
  offset?: number
}

export interface WorkdayGetWorkerParams extends WorkdayBaseParams {
  workerId: string
}

export interface WorkdayObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface WorkdayListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; total?: number }
  }
}

export type WorkdayResponse = WorkdayObjectResponse | WorkdayListResponse
