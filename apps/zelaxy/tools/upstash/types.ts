import type { ToolResponse } from '@/tools/types'

export interface UpstashBaseParams {
  restUrl: string
  restToken: string
}

export interface UpstashRedisGetParams extends UpstashBaseParams {
  key: string
}

export interface UpstashRedisSetParams extends UpstashBaseParams {
  key: string
  value: string
}

export interface UpstashRunCommandParams extends UpstashBaseParams {
  command: any[]
}

export interface UpstashResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { result: any }
  }
}
