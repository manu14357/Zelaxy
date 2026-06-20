import type { ToolResponse } from '@/tools/types'

export interface TriggerDevBaseParams {
  apiKey: string
}

export interface TriggerDevTriggerTaskParams extends TriggerDevBaseParams {
  taskIdentifier: string
  payload?: Record<string, any>
  idempotencyKey?: string
}

export interface TriggerDevGetRunParams extends TriggerDevBaseParams {
  runId: string
}

export interface TriggerDevListRunsParams extends TriggerDevBaseParams {
  status?: string
  taskIdentifier?: string
  pageSize?: number
}

export interface TriggerDevObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface TriggerDevListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type TriggerDevResponse = TriggerDevObjectResponse | TriggerDevListResponse
