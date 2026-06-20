import type { ToolResponse } from '@/tools/types'

export interface GongBaseParams {
  accessKey: string
  accessKeySecret: string
}

export interface GongListCallsParams extends GongBaseParams {
  fromDateTime?: string
  toDateTime?: string
}

export interface GongGetCallParams extends GongBaseParams {
  callId: string
}

export interface GongListUsersParams extends GongBaseParams {}

export interface GongObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface GongListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type GongResponse = GongObjectResponse | GongListResponse
