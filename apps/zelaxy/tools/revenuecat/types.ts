import type { ToolResponse } from '@/tools/types'

export interface RevenueCatBaseParams {
  apiKey: string
  projectId: string
}

export interface GetCustomerParams extends RevenueCatBaseParams {
  customerId: string
}

export interface ListCustomersParams extends RevenueCatBaseParams {
  limit?: number
  startingAfter?: string
}

export interface GetSubscriptionParams extends RevenueCatBaseParams {
  customerId: string
}

export interface RevenueCatObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; object?: string }
  }
}

export interface RevenueCatListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; next_page?: string | null }
  }
}

export type RevenueCatResponse = RevenueCatObjectResponse | RevenueCatListResponse
