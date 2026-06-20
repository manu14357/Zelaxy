import type { ToolResponse } from '@/tools/types'

export interface GoogleGroupsBaseParams {
  accessToken: string
}

export interface GoogleGroupsListGroupsParams extends GoogleGroupsBaseParams {
  maxResults?: number
}

export interface GoogleGroupsGetGroupParams extends GoogleGroupsBaseParams {
  groupKey: string
}

export interface GoogleGroupsListMembersParams extends GoogleGroupsBaseParams {
  groupKey: string
  maxResults?: number
}

export interface GoogleGroupsAddMemberParams extends GoogleGroupsBaseParams {
  groupKey: string
  email: string
  role?: string
}

export interface GoogleGroupsObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; email?: string }
  }
}

export interface GoogleGroupsListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken?: string }
  }
}

export type GoogleGroupsResponse = GoogleGroupsObjectResponse | GoogleGroupsListResponse
