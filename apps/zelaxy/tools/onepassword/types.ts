import type { ToolResponse } from '@/tools/types'

export interface OnePasswordBaseParams {
  apiKey: string
  connectUrl: string
}

export interface ListVaultsParams extends OnePasswordBaseParams {}

export interface ListItemsParams extends OnePasswordBaseParams {
  vaultId: string
}

export interface GetItemParams extends OnePasswordBaseParams {
  vaultId: string
  itemId: string
}

export interface OnePasswordObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface OnePasswordListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type OnePasswordResponse = OnePasswordObjectResponse | OnePasswordListResponse
