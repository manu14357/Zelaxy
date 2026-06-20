import type { ToolResponse } from '@/tools/types'

export interface LangSmithBaseParams {
  apiKey: string
}

export interface ListRunsParams extends LangSmithBaseParams {
  session: string
  limit?: number
}

export interface GetRunParams extends LangSmithBaseParams {
  runId: string
}

export interface CreateFeedbackParams extends LangSmithBaseParams {
  run_id: string
  key: string
  score?: number
}

export interface LangSmithObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface LangSmithListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type LangSmithResponse = LangSmithObjectResponse | LangSmithListResponse
