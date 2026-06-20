import type { ToolResponse } from '@/tools/types'

export interface NeverBounceBaseParams {
  apiKey: string
}

export interface VerifyEmailParams extends NeverBounceBaseParams {
  email: string
}

export interface GetAccountParams extends NeverBounceBaseParams {}

export interface NeverBounceObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { email?: string; result?: string }
  }
}

export interface NeverBounceAccountResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status?: string }
  }
}

export type NeverBounceResponse = NeverBounceObjectResponse | NeverBounceAccountResponse
