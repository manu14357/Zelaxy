import type { ToolResponse } from '@/tools/types'

export interface ServiceNowBaseParams {
  instanceUrl: string
  username: string
  password: string
}

export interface ServiceNowQueryTableParams extends ServiceNowBaseParams {
  tableName: string
  query?: string
  limit?: number
}

export interface ServiceNowCreateRecordParams extends ServiceNowBaseParams {
  tableName: string
  fields: Record<string, any>
}

export interface ServiceNowGetRecordParams extends ServiceNowBaseParams {
  tableName: string
  sysId: string
}

export interface ServiceNowUpdateRecordParams extends ServiceNowBaseParams {
  tableName: string
  sysId: string
  fields: Record<string, any>
}

export interface ServiceNowRecordResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { table: string; sysId?: string }
  }
}

export interface ServiceNowListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { table: string; count: number }
  }
}

export type ServiceNowResponse = ServiceNowRecordResponse | ServiceNowListResponse
