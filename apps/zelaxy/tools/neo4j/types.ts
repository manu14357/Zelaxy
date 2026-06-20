import type { ToolResponse } from '@/tools/types'

export interface Neo4jBaseParams {
  dbUrl: string
  username: string
  password: string
  database: string
}

export interface Neo4jRunQueryParams extends Neo4jBaseParams {
  statement: string
  parameters?: Record<string, any>
}

export interface Neo4jResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: Record<string, any>
  }
}
