export interface MSSQLConnectionParams {
  server: string
  database: string
  username: string
  password: string
  port?: number
  encrypt?: boolean
  trustServerCertificate?: boolean
}

export interface MSSQLQueryParams extends MSSQLConnectionParams {
  action:
    | 'execute'
    | 'insert'
    | 'update'
    | 'delete'
    | 'create_file'
    | 'delete_file'
    | 'edit_file'
    | 'get_file'
    | 'list_files'
  query?: string
  table?: string
  data?: Record<string, any> | Record<string, any>[]
  conditions?: Record<string, any>

  // Repository/File operations
  filePath?: string
  content?: string
  folderPath?: string
}

import type { ToolResponse } from '@/tools/types'

export interface MSSQLQueryResult extends ToolResponse {
  output: {
    data?: any[]
    affectedRows?: number
    metadata?: {
      columns?: string[]
      rowCount?: number
      executionTime?: number
    }
    fileName?: string
    filePath?: string
    content?: string
    files?: Array<{
      name: string
      path: string
      type: 'file' | 'folder'
      size?: number
      lastModified?: string
    }>
    error?: string
    errorDetails?: {
      message: string
      type: string
      executionTime?: number
    }
  }
}

export type MSSQLResponse = MSSQLQueryResult
