import type { ToolResponse } from '@/tools/types'

export interface ResendSendParams {
  apiKey: string
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  cc?: string
  bcc?: string
  replyTo?: string
  scheduledAt?: string
  headers?: string
  tags?: string
  attachments?: string
}

export interface ResendBatchParams {
  apiKey: string
  emails: string
}

export interface ResendGetParams {
  apiKey: string
  emailId: string
}

export interface ResendCancelParams {
  apiKey: string
  emailId: string
}

export interface ResendResponse extends ToolResponse {
  output: {
    id?: string
    ids?: string[]
    email?: Record<string, any>
    error?: string
    status?: string
  }
}
