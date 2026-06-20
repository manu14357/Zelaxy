import type { ToolResponse } from '@/tools/types'

export interface GoogleContactsBaseParams {
  accessToken: string
}

export interface ListContactsParams extends GoogleContactsBaseParams {
  pageSize?: number
  pageToken?: string
}

export interface GetContactParams extends GoogleContactsBaseParams {
  resourceName: string
}

export interface SearchContactsParams extends GoogleContactsBaseParams {
  query: string
  pageSize?: number
}

export interface CreateContactParams extends GoogleContactsBaseParams {
  givenName: string
  familyName?: string
  email?: string
  phone?: string
}

export interface GoogleContactsObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { resourceName: string }
  }
}

export interface GoogleContactsListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken: string | null }
  }
}

export type GoogleContactsResponse = GoogleContactsObjectResponse | GoogleContactsListResponse
