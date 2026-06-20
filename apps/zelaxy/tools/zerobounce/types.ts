import type { ToolResponse } from '@/tools/types'

export interface ZeroBounceBaseParams {
  apiKey: string
}

export interface ValidateEmailParams extends ZeroBounceBaseParams {
  email: string
}

export interface GetCreditsParams extends ZeroBounceBaseParams {}

export interface ZeroBounceObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { email?: string; status?: string }
  }
}

export interface ZeroBounceCreditsResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { credits: number }
  }
}

export type ZeroBounceResponse = ZeroBounceObjectResponse | ZeroBounceCreditsResponse
