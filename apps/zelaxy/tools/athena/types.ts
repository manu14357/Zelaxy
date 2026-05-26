import type { ToolResponse } from '@/tools/types'

interface AthenaConnectionConfig {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface AthenaStartQueryParams extends AthenaConnectionConfig {
  queryString: string
  database?: string
  catalog?: string
  outputLocation?: string
  workGroup?: string
}

export interface AthenaStartQueryResponse extends ToolResponse {
  output: {
    queryExecutionId: string
  }
}

export interface AthenaGetQueryExecutionParams extends AthenaConnectionConfig {
  queryExecutionId: string
}

export interface AthenaGetQueryExecutionResponse extends ToolResponse {
  output: {
    queryExecutionId: string
    query: string
    state: string
    stateChangeReason: string | null
    statementType: string | null
    database: string | null
    catalog: string | null
    workGroup: string | null
    submissionDateTime: number | null
    completionDateTime: number | null
    dataScannedInBytes: number | null
    engineExecutionTimeInMillis: number | null
    queryPlanningTimeInMillis: number | null
    queryQueueTimeInMillis: number | null
    totalExecutionTimeInMillis: number | null
    outputLocation: string | null
  }
}

export interface AthenaGetQueryResultsParams extends AthenaConnectionConfig {
  queryExecutionId: string
  maxResults?: number
  nextToken?: string
}

export interface AthenaGetQueryResultsResponse extends ToolResponse {
  output: {
    columns: { name: string; type: string }[]
    rows: Record<string, string>[]
    nextToken: string | null
    updateCount: number | null
  }
}

export interface AthenaStopQueryParams extends AthenaConnectionConfig {
  queryExecutionId: string
}

export interface AthenaStopQueryResponse extends ToolResponse {
  output: {
    success: boolean
  }
}

export interface AthenaListQueryExecutionsParams extends AthenaConnectionConfig {
  workGroup?: string
  maxResults?: number
  nextToken?: string
}

export interface AthenaListQueryExecutionsResponse extends ToolResponse {
  output: {
    queryExecutionIds: string[]
    nextToken: string | null
  }
}
