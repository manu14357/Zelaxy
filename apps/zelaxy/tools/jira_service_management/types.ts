import type { ToolResponse } from '@/tools/types'

export interface JiraSmBaseParams {
  siteUrl: string
  email: string
  apiToken: string
}

export interface JiraSmListServiceDesksParams extends JiraSmBaseParams {
  limit?: number
}

export interface JiraSmCreateRequestParams extends JiraSmBaseParams {
  serviceDeskId: string
  requestTypeId: string
  requestFieldValues: Record<string, any>
}

export interface JiraSmGetRequestParams extends JiraSmBaseParams {
  issueIdOrKey: string
}

export interface JiraSmListRequestsParams extends JiraSmBaseParams {
  serviceDeskId?: string
  limit?: number
}

export interface JiraSmObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; issueKey?: string }
  }
}

export interface JiraSmListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; isLastPage: boolean }
  }
}

export type JiraSmResponse = JiraSmObjectResponse | JiraSmListResponse
