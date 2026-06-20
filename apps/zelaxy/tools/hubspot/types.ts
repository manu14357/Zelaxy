import type { ToolResponse } from '@/tools/types'

export interface HubspotBaseParams {
  apiKey: string
}

export interface CreateContactParams extends HubspotBaseParams {
  properties: Record<string, any>
}

export interface GetContactParams extends HubspotBaseParams {
  contactId: string
  properties?: string
}

export interface ListContactsParams extends HubspotBaseParams {
  limit?: number
  after?: string
  properties?: string
}

export interface SearchContactsParams extends HubspotBaseParams {
  query?: string
  filterGroups?: Record<string, any>[]
  properties?: string[]
  limit?: number
}

export interface CreateDealParams extends HubspotBaseParams {
  properties: Record<string, any>
}

export interface HubspotObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface HubspotListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; after: string | null }
  }
}

export type HubspotResponse = HubspotObjectResponse | HubspotListResponse
