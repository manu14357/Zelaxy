import type { ToolResponse } from '@/tools/types'

export interface SquareBaseParams {
  apiKey: string
}

export interface ListCustomersParams extends SquareBaseParams {
  limit?: number
}

export interface CreateCustomerParams extends SquareBaseParams {
  given_name?: string
  email_address?: string
}

export interface ListPaymentsParams extends SquareBaseParams {
  limit?: number
}

export interface GetPaymentParams extends SquareBaseParams {
  payment_id: string
}

export interface SquareObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface SquareListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type SquareResponse = SquareObjectResponse | SquareListResponse
