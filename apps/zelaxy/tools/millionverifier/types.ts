import type { ToolResponse } from '@/tools/types'

export interface MillionVerifierBaseParams {
  apiKey: string
}

export interface VerifyEmailParams extends MillionVerifierBaseParams {
  email: string
}

export interface GetCreditsParams extends MillionVerifierBaseParams {}

export interface MillionVerifierObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { email?: string; result?: string }
  }
}

export interface MillionVerifierCreditsResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { credits: number }
  }
}

export type MillionVerifierResponse = MillionVerifierObjectResponse | MillionVerifierCreditsResponse
