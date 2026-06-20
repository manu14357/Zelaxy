import type { ToolResponse } from '@/tools/types'

export interface GooglePagespeedBaseParams {
  apiKey: string
}

export interface AnalyzeParams extends GooglePagespeedBaseParams {
  url: string
  strategy?: string
  category?: string
}

export interface GooglePagespeedAnalyzeResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; strategy: string }
  }
}

export type GooglePagespeedResponse = GooglePagespeedAnalyzeResponse
