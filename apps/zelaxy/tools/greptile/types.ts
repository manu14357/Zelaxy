import type { ToolResponse } from '@/tools/types'

export interface GreptileBaseParams {
  apiKey: string
  githubToken: string
}

export interface QueryParams extends GreptileBaseParams {
  query: string
  repositories: any
}

export interface SearchParams extends GreptileBaseParams {
  query: string
  repositories: any
}

export interface IndexRepositoryParams extends GreptileBaseParams {
  remote: string
  repository: string
  branch?: string
}

export interface GreptileObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status?: string }
  }
}

export type GreptileResponse = GreptileObjectResponse
