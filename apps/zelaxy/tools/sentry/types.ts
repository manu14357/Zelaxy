import type { ToolResponse } from '@/tools/types'

export interface SentryBaseParams {
  apiKey: string
}

export interface SentryListProjectsParams extends SentryBaseParams {
  limit?: number
}

export interface SentryListIssuesParams extends SentryBaseParams {
  organizationSlug: string
  projectSlug: string
  query?: string
}

export interface SentryGetIssueParams extends SentryBaseParams {
  issueId: string
}

export interface SentryUpdateIssueParams extends SentryBaseParams {
  issueId: string
  status?: string
}

export interface SentryObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface SentryListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type SentryResponse = SentryObjectResponse | SentryListResponse
