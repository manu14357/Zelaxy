import type { ToolResponse } from '@/tools/types'

export interface CodepipelineBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface CodepipelineListPipelinesParams extends CodepipelineBaseParams {}

export interface CodepipelineGetPipelineParams extends CodepipelineBaseParams {
  name: string
}

export interface CodepipelineGetPipelineStateParams extends CodepipelineBaseParams {
  name: string
}

export interface CodepipelineResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
