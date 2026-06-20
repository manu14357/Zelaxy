import type { ToolResponse } from '@/tools/types'

export interface ExtendBaseParams {
  apiKey: string
}

export interface ExtendParseParams extends ExtendBaseParams {
  fileUrl: string
  outputFormat?: string
  chunking?: string
  engine?: string
}

export interface ExtendGetRunParams extends ExtendBaseParams {
  runId: string
}

export interface ExtendObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string | null; status: string | null }
  }
}

export type ExtendResponse = ExtendObjectResponse
