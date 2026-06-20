import type { ToolResponse } from '@/tools/types'

export interface Rb2bBaseParams {
  apiKey: string
}

export interface Rb2bListVisitorsParams extends Rb2bBaseParams {
  limit?: number
}

export interface Rb2bGetVisitorParams extends Rb2bBaseParams {
  id: string
}

export interface Rb2bObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string }
  }
}

export interface Rb2bListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type Rb2bResponse = Rb2bObjectResponse | Rb2bListResponse
