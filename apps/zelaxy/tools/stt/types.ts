import type { ToolResponse } from '@/tools/types'

export interface SttBaseParams {
  apiKey: string
}

export interface SttTranscribeParams extends SttBaseParams {
  audioUrl: string
  model?: string
  language?: string
}

export interface SttResponse extends ToolResponse {
  output: {
    data: { transcript: string; segments: Record<string, any>[]; language: string | null }
    metadata: { language: string | null; segmentCount: number }
  }
}
