import type { ToolResponse } from '@/tools/types'

export interface AppConfigBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface AppConfigListApplicationsParams extends AppConfigBaseParams {}

export interface AppConfigListEnvironmentsParams extends AppConfigBaseParams {
  applicationId: string
}

export interface AppConfigListConfigurationProfilesParams extends AppConfigBaseParams {
  applicationId: string
}

export interface AppConfigResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
