import type { ToolResponse } from '@/tools/types'

export interface NewRelicBaseParams {
  apiKey: string
}

export interface NrqlQueryParams extends NewRelicBaseParams {
  accountId: number
  nrql: string
}

export interface ListAlertPoliciesParams extends NewRelicBaseParams {
  accountId: number
}

export interface NewRelicResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}
