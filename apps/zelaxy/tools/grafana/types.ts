import type { ToolResponse } from '@/tools/types'

export interface GrafanaBaseParams {
  apiKey: string
  instanceUrl: string
}

export interface SearchDashboardsParams extends GrafanaBaseParams {
  query?: string
}

export interface GetDashboardParams extends GrafanaBaseParams {
  uid: string
}

export interface ListDatasourcesParams extends GrafanaBaseParams {}

export interface ListAlertsParams extends GrafanaBaseParams {}

export interface GrafanaObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { uid?: string }
  }
}

export interface GrafanaListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type GrafanaResponse = GrafanaObjectResponse | GrafanaListResponse
