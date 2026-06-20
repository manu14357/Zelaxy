import type { ToolResponse } from '@/tools/types'

export interface GoogleTasksBaseParams {
  accessToken: string
}

export interface ListTaskListsParams extends GoogleTasksBaseParams {
  maxResults?: number
}

export interface ListTasksParams extends GoogleTasksBaseParams {
  tasklist?: string
  maxResults?: number
  showCompleted?: boolean
}

export interface CreateTaskParams extends GoogleTasksBaseParams {
  tasklist?: string
  title: string
  notes?: string
  due?: string
}

export interface CompleteTaskParams extends GoogleTasksBaseParams {
  tasklist?: string
  task: string
}

export interface GoogleTasksObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface GoogleTasksListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextPageToken: string | null }
  }
}

export type GoogleTasksResponse = GoogleTasksObjectResponse | GoogleTasksListResponse
