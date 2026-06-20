import type { ToolResponse } from '@/tools/types'

export interface SecretsManagerBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface SecretsManagerGetSecretValueParams extends SecretsManagerBaseParams {
  secretId: string
}

export interface SecretsManagerListSecretsParams extends SecretsManagerBaseParams {
  maxResults?: number
}

export interface SecretsManagerCreateSecretParams extends SecretsManagerBaseParams {
  name: string
  secretString: string
}

export interface SecretsManagerResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
