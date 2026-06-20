import type { ToolResponse } from '@/tools/types'

export interface SendgridBaseParams {
  apiKey: string
}

export interface SendEmailParams extends SendgridBaseParams {
  to: string
  from: string
  subject: string
  content: string
}

export interface AddContactParams extends SendgridBaseParams {
  email: string
  firstName?: string
  lastName?: string
}

export interface ListContactsParams extends SendgridBaseParams {}

export interface SendgridObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { statusCode: number }
  }
}

export interface SendgridListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type SendgridResponse = SendgridObjectResponse | SendgridListResponse
