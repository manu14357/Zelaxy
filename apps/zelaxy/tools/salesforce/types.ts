import type { ToolResponse } from '@/tools/types'

export interface SalesforceBaseParams {
  apiKey: string
  instanceUrl: string
}

export interface CreateRecordParams extends SalesforceBaseParams {
  sobject: string
  fields: Record<string, any>
}

export interface QueryParams extends SalesforceBaseParams {
  query: string
}

export interface UpdateRecordParams extends SalesforceBaseParams {
  sobject: string
  recordId: string
  fields: Record<string, any>
}

export interface GetRecordParams extends SalesforceBaseParams {
  sobject: string
  recordId: string
  fields?: string
}

export interface SalesforceObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface SalesforceQueryResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { totalSize: number; done: boolean }
  }
}

export type SalesforceResponse = SalesforceObjectResponse | SalesforceQueryResponse
