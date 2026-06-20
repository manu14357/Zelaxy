import type { ToolResponse } from '@/tools/types'

export interface SqsBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface SqsSendMessageParams extends SqsBaseParams {
  queueUrl: string
  messageBody: string
}

export interface SqsReceiveMessageParams extends SqsBaseParams {
  queueUrl: string
  maxMessages?: number
}

export interface SqsListQueuesParams extends SqsBaseParams {
  prefix?: string
}

export interface SqsResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
