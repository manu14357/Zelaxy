import type { ToolResponse } from '@/tools/types'

export interface TtsBaseParams {
  apiKey: string
}

export interface TtsSynthesizeParams extends TtsBaseParams {
  text: string
  voiceId: string
  modelId?: string
}

export interface TtsResponse extends ToolResponse {
  output: {
    data: { audioBase64: string; mimeType: string; format: string }
    metadata: { voiceId: string; characterCount: number }
  }
}
