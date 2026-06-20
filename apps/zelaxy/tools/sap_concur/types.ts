import type { ToolResponse } from '@/tools/types'

export interface SapConcurBaseParams {
  accessToken: string
}

export interface ListReportsParams extends SapConcurBaseParams {
  user?: string
  limit?: number
  approvalStatusCode?: string
}

export interface GetReportParams extends SapConcurBaseParams {
  reportId: string
  user?: string
}

export interface ListUsersParams extends SapConcurBaseParams {
  primaryEmail?: string
  limit?: number
}

export interface SapConcurObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; status: number }
  }
}

export interface SapConcurListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; status: number }
  }
}

export type SapConcurResponse = SapConcurObjectResponse | SapConcurListResponse
