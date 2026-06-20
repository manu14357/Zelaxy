import type { ToolResponse } from '@/tools/types'

export interface InfisicalBaseParams {
  apiKey: string
  workspaceId: string
  environment?: string
}

export interface ListSecretsParams extends InfisicalBaseParams {}

export interface GetSecretParams extends InfisicalBaseParams {
  secretName: string
}

export interface CreateSecretParams extends InfisicalBaseParams {
  secretName: string
  secretValue: string
}

export interface InfisicalObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { secretName: string }
  }
}

export interface InfisicalListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type InfisicalResponse = InfisicalObjectResponse | InfisicalListResponse
