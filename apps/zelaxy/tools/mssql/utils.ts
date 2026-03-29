import type { MSSQLConnectionParams, MSSQLResponse } from './types'

/**
 * Validates MSSQL connection parameters
 */
export function validateConnectionParams(params: MSSQLConnectionParams): string[] {
  const errors: string[] = []

  if (!params.server?.trim()) {
    errors.push('Server is required')
  }

  if (!params.database?.trim()) {
    errors.push('Database is required')
  }

  if (!params.username?.trim()) {
    errors.push('Username is required')
  }

  if (!params.password?.trim()) {
    errors.push('Password is required')
  }

  if (params.port && (params.port < 1 || params.port > 65535)) {
    errors.push('Port must be between 1 and 65535')
  }

  return errors
}

/**
 * Validates SQL query for potential injection attacks
 */
export function validateQuery(query: string): string[] {
  const errors: string[] = []
  const suspiciousPatterns = [
    /;\s*(drop|delete|truncate|alter)\s+/i,
    /union\s+select/i,
    /'\s*or\s+'1'\s*=\s*'1/i,
    /--\s*$/,
    /\/\*[\s\S]*\*\//,
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(query)) {
      errors.push('Query contains potentially dangerous SQL patterns')
      break
    }
  }

  return errors
}

/**
 * Sanitizes table and column names to prevent SQL injection
 */
export function sanitizeIdentifier(identifier: string): string {
  // Remove any characters that aren't alphanumeric, underscore, or dot
  return identifier.replace(/[^a-zA-Z0-9_.]/g, '')
}

/**
 * Builds parameterized INSERT query
 */
export function buildInsertQuery(
  table: string,
  data: Record<string, any>[]
): {
  query: string
  params: any[]
} {
  if (!data.length) {
    throw new Error('No data provided for insert')
  }

  const sanitizedTable = sanitizeIdentifier(table)
  const columns = Object.keys(data[0])
  const sanitizedColumns = columns.map(sanitizeIdentifier)

  const placeholders = data
    .map(
      (_, index) =>
        `(${columns.map((_, colIndex) => `@param${data.length * colIndex + index}`).join(', ')})`
    )
    .join(', ')

  const query = `INSERT INTO [${sanitizedTable}] ([${sanitizedColumns.join('], [')}]) VALUES ${placeholders}`

  const params: any[] = []
  data.forEach((row, rowIndex) => {
    columns.forEach((col, colIndex) => {
      params.push(row[col])
    })
  })

  return { query, params }
}

/**
 * Builds parameterized UPDATE query
 */
export function buildUpdateQuery(
  table: string,
  data: Record<string, any>,
  conditions: Record<string, any>
): { query: string; params: any[] } {
  const sanitizedTable = sanitizeIdentifier(table)

  const setClause = Object.keys(data)
    .map((key, index) => `[${sanitizeIdentifier(key)}] = @param${index}`)
    .join(', ')

  const whereClause = Object.keys(conditions)
    .map((key, index) => `[${sanitizeIdentifier(key)}] = @condition${index}`)
    .join(' AND ')

  const query = `UPDATE [${sanitizedTable}] SET ${setClause} WHERE ${whereClause}`
  const params = [...Object.values(data), ...Object.values(conditions)]

  return { query, params }
}

/**
 * Builds parameterized DELETE query
 */
export function buildDeleteQuery(
  table: string,
  conditions: Record<string, any>
): { query: string; params: any[] } {
  const sanitizedTable = sanitizeIdentifier(table)

  const whereClause = Object.keys(conditions)
    .map((key, index) => `[${sanitizeIdentifier(key)}] = @param${index}`)
    .join(' AND ')

  const query = `DELETE FROM [${sanitizedTable}] WHERE ${whereClause}`
  const params = Object.values(conditions)

  return { query, params }
}

/**
 * Simulates file system operations for repository actions
 */
export class MSSQLFileSystem {
  private static files: Map<string, { content: string; lastModified: Date }> = new Map()

  static createFile(filePath: string, content: string): boolean {
    try {
      MSSQLFileSystem.files.set(filePath, {
        content,
        lastModified: new Date(),
      })
      return true
    } catch {
      return false
    }
  }

  static getFile(filePath: string): { content: string; lastModified: Date } | null {
    return MSSQLFileSystem.files.get(filePath) || null
  }

  static editFile(filePath: string, content: string): boolean {
    if (!MSSQLFileSystem.files.has(filePath)) {
      return false
    }

    MSSQLFileSystem.files.set(filePath, {
      content,
      lastModified: new Date(),
    })
    return true
  }

  static deleteFile(filePath: string): boolean {
    return MSSQLFileSystem.files.delete(filePath)
  }

  static listFiles(folderPath = ''): Array<{
    name: string
    path: string
    type: 'file' | 'folder'
    size: number
    lastModified: string
  }> {
    const files: Array<{
      name: string
      path: string
      type: 'file' | 'folder'
      size: number
      lastModified: string
    }> = []

    for (const [path, fileData] of MSSQLFileSystem.files.entries()) {
      if (path.startsWith(folderPath)) {
        const relativePath = path.substring(folderPath.length)
        const fileName = relativePath.split('/').pop() || ''

        files.push({
          name: fileName,
          path,
          type: 'file',
          size: fileData.content.length,
          lastModified: fileData.lastModified.toISOString(),
        })
      }
    }

    return files
  }
}

/**
 * Formats query results for consistent output
 */
export function formatQueryResult(
  success: boolean,
  data?: any[],
  affectedRows?: number,
  error?: string,
  executionTime?: number
): MSSQLResponse {
  const output: any = {}

  if (data) {
    output.data = data
    output.metadata = {
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      rowCount: data.length,
      executionTime,
    }
  }

  if (affectedRows !== undefined) {
    output.affectedRows = affectedRows
  }

  return {
    success,
    output,
    ...(error && { error }),
  }
}

/**
 * Formats file operation results
 */
export function formatFileResult(
  success: boolean,
  fileName?: string,
  filePath?: string,
  content?: string,
  files?: Array<any>,
  error?: string
): MSSQLResponse {
  const output: any = {}

  if (fileName) output.fileName = fileName
  if (filePath) output.filePath = filePath
  if (content) output.content = content
  if (files) output.files = files

  return {
    success,
    output,
    ...(error && { error }),
  }
}
