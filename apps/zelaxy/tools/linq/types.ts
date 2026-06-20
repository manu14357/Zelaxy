import type { ToolResponse } from '@/tools/types'

export interface LinqBaseParams {
  apiKey: string
}

export interface LinqSendMessageParams extends LinqBaseParams {
  chatId: string
  text?: string
  mediaUrl?: string
  linkUrl?: string
}

export interface LinqListChatsParams extends LinqBaseParams {
  from?: string
  to?: string
  limit?: number
  cursor?: string
}

export interface LinqListMessagesParams extends LinqBaseParams {
  chatId: string
  limit?: number
  cursor?: string
}

export interface LinqObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string | null }
  }
}

export interface LinqListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextCursor: string | null }
  }
}

export type LinqResponse = LinqObjectResponse | LinqListResponse
