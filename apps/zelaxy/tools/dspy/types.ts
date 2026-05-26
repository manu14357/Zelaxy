import type { ToolResponse } from '@/tools/types'

export interface DSPyRunParams {
  baseUrl: string
  apiKey?: string
  program: string
  input: string
}

export interface DSPyRunResponse extends ToolResponse {
  output: {
    output: string
    prediction: Record<string, unknown>
  }
}
