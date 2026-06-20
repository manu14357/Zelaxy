import type { ToolResponse } from '@/tools/types'

export interface DataverseBaseParams {
  accessToken: string
  orgUrl: string
}

export interface QueryRecordsParams extends DataverseBaseParams {
  entitySetName: string
  filter?: string
  top?: number
}

export interface CreateRecordParams extends DataverseBaseParams {
  entitySetName: string
  fields: Record<string, any>
}

export interface GetRecordParams extends DataverseBaseParams {
  entitySetName: string
  recordId: string
}

export interface DataverseObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { entitySetName: string; recordId?: string }
  }
}

export interface DataverseListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { entitySetName: string; count: number }
  }
}

export type DataverseResponse = DataverseObjectResponse | DataverseListResponse
