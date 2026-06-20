import type { ToolResponse } from '@/tools/types'

export interface ClickhouseBaseParams {
  host: string
  username: string
  password: string
}

export interface ClickhouseQueryParams extends ClickhouseBaseParams {
  sql: string
}

export type ClickhousePingParams = ClickhouseBaseParams

export interface ClickhouseQueryResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { rows: number; statistics?: Record<string, any> }
  }
}

export interface ClickhousePingResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { ok: boolean }
  }
}

export type ClickhouseResponse = ClickhouseQueryResponse | ClickhousePingResponse
