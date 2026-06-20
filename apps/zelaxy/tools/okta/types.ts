import type { ToolResponse } from '@/tools/types'

export interface OktaBaseParams {
  orgUrl: string
  apiToken: string
}

export interface OktaListUsersParams extends OktaBaseParams {
  search?: string
  limit?: number
}

export interface OktaGetUserParams extends OktaBaseParams {
  userId: string
}

export interface OktaCreateUserParams extends OktaBaseParams {
  firstName: string
  lastName: string
  email: string
  login?: string
}

export interface OktaListGroupsParams extends OktaBaseParams {
  search?: string
  limit?: number
}

export interface OktaObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; status?: string }
  }
}

export interface OktaListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type OktaResponse = OktaObjectResponse | OktaListResponse
