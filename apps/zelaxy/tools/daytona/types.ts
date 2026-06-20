import type { ToolResponse } from '@/tools/types'

export interface DaytonaBaseParams {
  apiKey: string
}

export interface DaytonaListWorkspacesParams extends DaytonaBaseParams {
  limit?: number
}

export interface DaytonaGetWorkspaceParams extends DaytonaBaseParams {
  workspaceId: string
}

export interface DaytonaCreateWorkspaceParams extends DaytonaBaseParams {
  name: string
  target?: string
}

export interface DaytonaObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface DaytonaListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type DaytonaResponse = DaytonaObjectResponse | DaytonaListResponse
