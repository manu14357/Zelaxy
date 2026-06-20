import type { ToolResponse } from '@/tools/types'

export interface TinybirdBaseParams {
  apiKey: string
}

export interface TinybirdQueryParams extends TinybirdBaseParams {
  sql: string
}

export type TinybirdListPipesParams = TinybirdBaseParams

export type TinybirdListDatasourcesParams = TinybirdBaseParams

export interface TinybirdResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { count: number }
  }
}
