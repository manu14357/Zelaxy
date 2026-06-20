import type { ToolResponse } from '@/tools/types'

export interface GoogleFormsBaseParams {
  accessToken: string
}

export interface GetFormParams extends GoogleFormsBaseParams {
  formId: string
}

export interface ListResponsesParams extends GoogleFormsBaseParams {
  formId: string
  pageSize?: number
  pageToken?: string
  filter?: string
}

export interface GetResponseParams extends GoogleFormsBaseParams {
  formId: string
  responseId: string
}

export interface GoogleFormsObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface GoogleFormsListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken: string | null }
  }
}

export type GoogleFormsResponse = GoogleFormsObjectResponse | GoogleFormsListResponse
