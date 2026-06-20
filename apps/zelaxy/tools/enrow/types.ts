import type { ToolResponse } from '@/tools/types'

export interface EnrowBaseParams {
  apiKey: string
}

export interface FindEmailParams extends EnrowBaseParams {
  fullname: string
  company: string
}

export interface VerifyEmailParams extends EnrowBaseParams {
  email: string
}

export interface GetResultParams extends EnrowBaseParams {
  id: string
}

export interface EnrowObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export type EnrowResponse = EnrowObjectResponse
