import type { ToolResponse } from '@/tools/types'

export interface SesBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface SesSendEmailParams extends SesBaseParams {
  fromEmail: string
  toEmail: string
  subject: string
  body: string
}

export interface SesListIdentitiesParams extends SesBaseParams {}

export interface SesResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
