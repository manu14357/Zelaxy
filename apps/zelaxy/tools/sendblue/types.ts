import type { ToolResponse } from '@/tools/types'

export interface SendblueBaseParams {
  apiKeyId: string
  apiSecret: string
}

export interface SendMessageParams extends SendblueBaseParams {
  number: string
  content: string
}

export interface GetMessagesParams extends SendblueBaseParams {}

export interface SendblueObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status: string }
  }
}

export interface SendblueListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type SendblueResponse = SendblueObjectResponse | SendblueListResponse
