import type { ToolResponse } from '@/tools/types'

export interface SMTPConnectionParams {
  host: string
  port: number
  username: string
  password: string
  secure: boolean
}

export interface SMTPSendParams extends SMTPConnectionParams {
  from?: string
  fromName?: string
  to: string
  cc?: string
  bcc?: string
  replyTo?: string
  subject: string
  body: string
  isHtml?: boolean
}

export interface SMTPSendResult {
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
}

export interface SMTPResponse extends ToolResponse {
  output: {
    messageId?: string
    accepted?: string[]
    rejected?: string[]
    status?: string
    error?: string
  }
}
