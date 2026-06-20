import type { ToolResponse } from '@/tools/types'

export interface MailgunBaseParams {
  apiKey: string
  domain: string
}

export interface SendEmailParams extends MailgunBaseParams {
  from: string
  to: string
  subject: string
  text: string
}

export interface ListEventsParams extends MailgunBaseParams {
  limit?: number
}

export interface MailgunObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { statusCode: number }
  }
}

export interface MailgunListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type MailgunResponse = MailgunObjectResponse | MailgunListResponse
