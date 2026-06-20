import type { ToolResponse } from '@/tools/types'

export interface LeadMagicBaseParams {
  apiKey: string
}

export interface EmailFinderParams extends LeadMagicBaseParams {
  first_name?: string
  last_name?: string
  domain?: string
  company_name?: string
}

export interface ProfileSearchParams extends LeadMagicBaseParams {
  profile_url: string
}

export interface EmailValidateParams extends LeadMagicBaseParams {
  email: string
}

export interface LeadMagicObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { credits_consumed: number }
  }
}

export type LeadMagicResponse = LeadMagicObjectResponse
