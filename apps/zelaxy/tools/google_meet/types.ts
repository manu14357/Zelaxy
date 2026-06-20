import type { ToolResponse } from '@/tools/types'

export interface GoogleMeetBaseParams {
  accessToken: string
}

export interface GoogleMeetCreateSpaceParams extends GoogleMeetBaseParams {}

export interface GoogleMeetGetSpaceParams extends GoogleMeetBaseParams {
  name: string
}

export interface GoogleMeetListConferenceRecordsParams extends GoogleMeetBaseParams {
  filter?: string
  pageSize?: number
}

export interface GoogleMeetObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { name?: string; meetingCode?: string }
  }
}

export interface GoogleMeetListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken?: string }
  }
}

export type GoogleMeetResponse = GoogleMeetObjectResponse | GoogleMeetListResponse
