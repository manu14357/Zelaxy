import type { ToolResponse } from '@/tools/types'

export interface MailchimpBaseParams {
  apiKey: string
  dc: string
}

export interface AddMemberParams extends MailchimpBaseParams {
  listId: string
  email: string
}

export interface ListMembersParams extends MailchimpBaseParams {
  listId: string
}

export interface GetListParams extends MailchimpBaseParams {
  listId: string
}

export interface MailchimpObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface MailchimpListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type MailchimpResponse = MailchimpObjectResponse | MailchimpListResponse
