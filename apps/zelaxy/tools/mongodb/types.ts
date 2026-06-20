import type { ToolResponse } from '@/tools/types'

export interface MongodbBaseParams {
  dataApiUrl: string
  apiKey: string
  dataSource: string
  database: string
}

export interface MongodbFindParams extends MongodbBaseParams {
  collection: string
  filter?: Record<string, any>
  limit?: number
}

export interface MongodbInsertOneParams extends MongodbBaseParams {
  collection: string
  document: Record<string, any>
}

export interface MongodbUpdateOneParams extends MongodbBaseParams {
  collection: string
  filter?: Record<string, any>
  update?: Record<string, any>
}

export interface MongodbDeleteOneParams extends MongodbBaseParams {
  collection: string
  filter?: Record<string, any>
}

export interface MongodbResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: Record<string, any>
  }
}
