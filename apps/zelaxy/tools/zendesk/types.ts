import type { ToolResponse } from '@/tools/types'

export interface ZendeskBaseParams {
  subdomain: string
  email: string
  apiToken: string
}

export interface ZendeskCreateTicketParams extends ZendeskBaseParams {
  subject: string
  body: string
}

export interface ZendeskListTicketsParams extends ZendeskBaseParams {}

export interface ZendeskGetTicketParams extends ZendeskBaseParams {
  ticketId: string
}

export interface ZendeskUpdateTicketParams extends ZendeskBaseParams {
  ticketId: string
  status?: string
}

export interface ZendeskSearchParams extends ZendeskBaseParams {
  query: string
}

export interface ZendeskObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: number }
  }
}

export interface ZendeskListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type ZendeskResponse = ZendeskObjectResponse | ZendeskListResponse
