import type { ToolResponse } from '@/tools/types'

export interface KetchGetConsentParams {
  organizationCode: string
  propertyCode: string
  environmentCode: string
  jurisdictionCode?: string
  identities: Record<string, string>
  purposes?: Record<string, any>
}

export interface KetchSetConsentParams {
  organizationCode: string
  propertyCode: string
  environmentCode: string
  jurisdictionCode?: string
  identities: Record<string, string>
  purposes: Record<string, any>
  collectedAt?: number
}

export interface KetchInvokeRightParams {
  organizationCode: string
  propertyCode: string
  environmentCode: string
  jurisdictionCode: string
  rightCode: string
  identities: Record<string, string>
  userData?: Record<string, any>
}

export interface KetchConsentResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { organizationCode: string }
  }
}

export interface KetchInvokeRightResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { organizationCode: string; rightCode: string }
  }
}

export type KetchResponse = KetchConsentResponse | KetchInvokeRightResponse
