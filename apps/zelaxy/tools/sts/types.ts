import type { ToolResponse } from '@/tools/types'

export interface StsBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface StsGetCallerIdentityParams extends StsBaseParams {}

export interface StsGetSessionTokenParams extends StsBaseParams {
  durationSeconds?: number
}

export interface StsResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
