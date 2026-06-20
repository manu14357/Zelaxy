import type { ToolResponse } from '@/tools/types'

export interface IdentityCenterBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface IdentityCenterListUsersParams extends IdentityCenterBaseParams {
  identityStoreId: string
}

export interface IdentityCenterListGroupsParams extends IdentityCenterBaseParams {
  identityStoreId: string
}

export interface IdentityCenterGetUserIdParams extends IdentityCenterBaseParams {
  identityStoreId: string
  userName: string
}

export interface IdentityCenterResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
