import type { ToolResponse } from '@/tools/types'

export interface GoogleVaultBaseParams {
  accessToken: string
}

export interface GoogleVaultListMattersParams extends GoogleVaultBaseParams {
  pageSize?: number
}

export interface GoogleVaultGetMatterParams extends GoogleVaultBaseParams {
  matterId: string
}

export interface GoogleVaultCreateMatterParams extends GoogleVaultBaseParams {
  name: string
  description?: string
}

export interface GoogleVaultListExportsParams extends GoogleVaultBaseParams {
  matterId: string
  pageSize?: number
}

export interface GoogleVaultResponse extends ToolResponse {
  output: {
    data: Record<string, any> | Record<string, any>[]
    metadata: { nextPageToken?: string | null }
  }
}
