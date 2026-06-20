import type { ToolResponse } from '@/tools/types'

export interface StripeBaseParams {
  apiKey: string
}

export interface CreateCustomerParams extends StripeBaseParams {
  email?: string
  name?: string
  phone?: string
  description?: string
  metadata?: Record<string, any>
}

export interface ListParams extends StripeBaseParams {
  limit?: number
  email?: string
  customer?: string
}

export interface CreatePaymentIntentParams extends StripeBaseParams {
  amount: number
  currency: string
  customer?: string
  description?: string
  metadata?: Record<string, any>
}

export interface CreateRefundParams extends StripeBaseParams {
  payment_intent?: string
  charge?: string
  amount?: number
  reason?: string
}

export interface StripeObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; object?: string }
  }
}

export interface StripeListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; has_more: boolean }
  }
}

export type StripeResponse = StripeObjectResponse | StripeListResponse
