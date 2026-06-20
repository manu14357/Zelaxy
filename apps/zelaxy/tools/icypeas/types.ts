import type { ToolResponse } from '@/tools/types'

export interface IcypeasBaseParams {
  apiKey: string
}

export interface EmailSearchParams extends IcypeasBaseParams {
  firstname: string
  lastname: string
  domainOrCompany: string
}

export interface EmailVerificationParams extends IcypeasBaseParams {
  email: string
}

export interface DomainSearchParams extends IcypeasBaseParams {
  domain: string
}

export interface IcypeasObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { searchId: string | null; status: string | null }
  }
}

export type IcypeasResponse = IcypeasObjectResponse
