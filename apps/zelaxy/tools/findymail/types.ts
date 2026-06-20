import type { ToolResponse } from '@/tools/types'

export interface FindymailBaseParams {
  apiKey: string
}

export interface FindEmailParams extends FindymailBaseParams {
  name: string
  domain: string
}

export interface FindFromLinkedinParams extends FindymailBaseParams {
  linkedin_url: string
}

export interface VerifyEmailParams extends FindymailBaseParams {
  email: string
}

export interface FindymailObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { email: string | null }
  }
}

export type FindymailResponse = FindymailObjectResponse
