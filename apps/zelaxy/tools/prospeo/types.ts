import type { ToolResponse } from '@/tools/types'

export interface ProspeoBaseParams {
  apiKey: string
}

export interface ProspeoEmailFinderParams extends ProspeoBaseParams {
  first_name: string
  last_name: string
  company: string
}

export interface ProspeoMobileFinderParams extends ProspeoBaseParams {
  url: string
}

export interface ProspeoLinkedinEmailFinderParams extends ProspeoBaseParams {
  url: string
}

export interface ProspeoObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { error: boolean }
  }
}

export type ProspeoResponse = ProspeoObjectResponse
