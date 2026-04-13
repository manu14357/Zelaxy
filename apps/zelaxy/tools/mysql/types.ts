import type { ToolResponse } from '@/tools/types'

export interface MySQLConnectionParams {
  host: string
  database: string
  username: string
  password?: string | null
  port?: number
  ssl?: boolean
}

export interface MySQLQueryParams extends MySQLConnectionParams {
  action: 'execute' | 'insert' | 'update' | 'delete'
  query?: string
  table?: string
  data?: Record<string, any> | Record<string, any>[]
  conditions?: Record<string, any>
}

export interface MySQLQueryResult extends ToolResponse {
  output: {
    data?: any[]
    affectedRows?: number
    metadata?: {
      columns?: string[]
      rowCount?: number
      executionTime?: number
    }
    error?: string
    errorDetails?: {
      message: string
      type: string
      executionTime?: number
    }
  }
}

export type MySQLResponse = MySQLQueryResult
