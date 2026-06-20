import type { ToolResponse } from '@/tools/types'

export interface GitlabBaseParams {
  apiKey: string
}

export interface GitlabListProjectsParams extends GitlabBaseParams {
  search?: string
  limit?: number
}

export interface GitlabGetProjectParams extends GitlabBaseParams {
  projectId: string
}

export interface GitlabListIssuesParams extends GitlabBaseParams {
  projectId: string
  state?: string
  labels?: string
}

export interface GitlabCreateIssueParams extends GitlabBaseParams {
  projectId: string
  title: string
  description?: string
  labels?: string
}

export interface GitlabGetFileParams extends GitlabBaseParams {
  projectId: string
  filePath: string
  ref: string
}

export interface GitlabObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string | number }
  }
}

export interface GitlabListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type GitlabResponse = GitlabObjectResponse | GitlabListResponse
