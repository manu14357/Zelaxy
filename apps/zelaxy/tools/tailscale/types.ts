import type { ToolResponse } from '@/tools/types'

export interface TailscaleBaseParams {
  apiKey: string
}

export interface ListDevicesParams extends TailscaleBaseParams {
  tailnet?: string
}

export interface GetDeviceParams extends TailscaleBaseParams {
  deviceId: string
}

export interface ListKeysParams extends TailscaleBaseParams {
  tailnet?: string
}

export interface TailscaleObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface TailscaleListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type TailscaleResponse = TailscaleObjectResponse | TailscaleListResponse
