import type { ToolResponse } from '@/tools/types'

export interface IntercomBaseParams {
  apiKey: string
}

export interface CreateContactParams extends IntercomBaseParams {
  role?: string
  email?: string
  name?: string
  phone?: string
}

export interface ListContactsParams extends IntercomBaseParams {
  per_page?: number
  starting_after?: string
}

export interface GetContactParams extends IntercomBaseParams {
  id: string
}

export interface SearchContactsParams extends IntercomBaseParams {
  field: string
  operator: string
  value: string
}

export interface IntercomObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; type?: string }
  }
}

export interface IntercomListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; total_count?: number }
  }
}

export type IntercomResponse = IntercomObjectResponse | IntercomListResponse
