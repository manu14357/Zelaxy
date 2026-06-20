import type { ToolResponse } from '@/tools/types'

export interface RipplingBaseParams {
  apiKey: string
}

export interface RipplingListWorkersParams extends RipplingBaseParams {
  filter?: string
  expand?: string
  orderBy?: string
  cursor?: string
}

export interface RipplingGetWorkerParams extends RipplingBaseParams {
  id: string
  expand?: string
}

export interface RipplingListCompaniesParams extends RipplingBaseParams {
  expand?: string
  orderBy?: string
  cursor?: string
}

export interface RipplingListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; next_link: string | null }
  }
}

export interface RipplingObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export type RipplingResponse = RipplingListResponse | RipplingObjectResponse
