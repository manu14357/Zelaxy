import type { ToolResponse } from '@/tools/types'

export interface ObsidianBaseParams {
  apiKey: string
  baseUrl: string
}

export interface ObsidianListFilesParams extends ObsidianBaseParams {
  path?: string
}

export interface ObsidianGetFileParams extends ObsidianBaseParams {
  filename: string
}

export interface ObsidianSearchParams extends ObsidianBaseParams {
  query: string
}

export interface ObsidianResponse extends ToolResponse {
  output: {
    data: any
    metadata: Record<string, any>
  }
}
