import type { ToolResponse } from '@/tools/types'

export interface QuartrBaseParams {
  apiKey: string
}

export interface QuartrGetCompanyParams extends QuartrBaseParams {
  companyId: string | number
}

export interface QuartrListCompaniesParams extends QuartrBaseParams {
  tickers?: string
  isins?: string
  countries?: string
  limit?: number
  cursor?: number
}

export interface QuartrListDocumentsParams extends QuartrBaseParams {
  companyIds?: string
  eventIds?: string
  documentTypeIds?: string
  startDate?: string
  endDate?: string
  limit?: number
  cursor?: number
}

export interface QuartrObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string | number | null }
  }
}

export interface QuartrListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; nextCursor: number | null }
  }
}

export type QuartrResponse = QuartrObjectResponse | QuartrListResponse
