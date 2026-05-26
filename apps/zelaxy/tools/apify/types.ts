import type { ToolResponse } from '@/tools/types'

export interface ApifyRunActorParams {
  apiKey: string
  actorId: string
  input?: string
  waitForFinish?: number
  itemLimit?: number
  memory?: number
  timeout?: number
  build?: string
}

export interface ApifyGetRunParams {
  apiKey: string
  actorId: string
  runId: string
}

export interface ApifyGetDatasetParams {
  apiKey: string
  datasetId: string
  limit?: number
  offset?: number
}

export interface ApifyRunActorResult extends ToolResponse {
  output: {
    success: boolean
    runId: string
    status: string
    datasetId?: string
    items?: unknown[]
  }
}

export interface ApifyGetRunResult extends ToolResponse {
  output: {
    id: string
    actId: string
    status: string
    startedAt: string
    finishedAt?: string
    defaultDatasetId: string
  }
}

export interface ApifyGetDatasetResult extends ToolResponse {
  output: {
    items: unknown[]
    count: number
    total: number
    offset: number
    limit: number
  }
}
