import type { ToolResponse } from '@/tools/types'

export interface ZoomBaseParams {
  apiKey: string
}

export interface ListMeetingsParams extends ZoomBaseParams {
  userId?: string
  type?: string
  page_size?: number
}

export interface CreateMeetingParams extends ZoomBaseParams {
  userId?: string
  topic: string
  type?: number
  start_time?: string
  duration?: number
  timezone?: string
  agenda?: string
}

export interface GetMeetingParams extends ZoomBaseParams {
  meetingId: string
}

export interface ListUsersParams extends ZoomBaseParams {
  status?: string
  page_size?: number
}

export interface ZoomObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; topic?: string }
  }
}

export interface ZoomListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; total_records?: number }
  }
}

export type ZoomResponse = ZoomObjectResponse | ZoomListResponse
