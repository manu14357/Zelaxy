import type { ToolResponse } from '@/tools/types'

export interface BrexBaseParams {
  apiKey: string
}

export interface BrexListCashAccountsParams extends BrexBaseParams {
  cursor?: string
  limit?: string
}

export interface BrexListCashTransactionsParams extends BrexBaseParams {
  accountId: string
  postedAtStart?: string
  cursor?: string
  limit?: string
}

export interface BrexListUsersParams extends BrexBaseParams {
  email?: string
  cursor?: string
  limit?: string
}

export interface BrexListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; next_cursor: string | null }
  }
}

export type BrexResponse = BrexListResponse
