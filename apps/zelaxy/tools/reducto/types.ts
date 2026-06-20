import type { ToolResponse } from '@/tools/types'

export interface ReductoBaseParams {
  apiKey: string
  documentUrl: string
}

export type ParseParams = ReductoBaseParams

export interface ExtractParams extends ReductoBaseParams {
  schema: Record<string, any>
  systemPrompt?: string
}

export interface SplitParams extends ReductoBaseParams {
  splitDescription: Record<string, any>[]
}

export interface ReductoResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { jobId?: string; status: number }
  }
}
