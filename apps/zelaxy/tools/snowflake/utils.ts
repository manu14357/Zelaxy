import type {
  SnowflakeBulkLoadOptions,
  SnowflakeColumnInfo,
  SnowflakeConnectionParams,
  SnowflakeMetrics,
  SnowflakeParams,
  SnowflakeTableSchema,
} from './types'

/**
 * Validate Snowflake connection parameters
 */
export function validateConnectionParams(params: SnowflakeConnectionParams): string[] {
  const errors: string[] = []

  if (!params.accountName?.trim()) {
    errors.push('Account name is required')
  }

  if (!params.database?.trim()) {
    errors.push('Database name is required')
  }

  if (!params.warehouse?.trim()) {
    errors.push('Warehouse name is required')
  }

  if (!params.schema?.trim()) {
    errors.push('Schema name is required')
  }

  // Validate authentication based on connection mode
  switch (params.connectionMode) {
    case 'credentials':
      if (!params.username?.trim()) {
        errors.push('Username is required for credential authentication')
      }
      if (!params.password?.trim()) {
        errors.push('Password is required for credential authentication')
      }
      break

    case 'oauth':
      if (!params.oauthToken?.trim()) {
        errors.push('OAuth token is required for OAuth authentication')
      }
      break

    case 'keypair':
      if (!params.username?.trim()) {
        errors.push('Username is required for key pair authentication')
      }
      if (!params.privateKey?.trim()) {
        errors.push('Private key is required for key pair authentication')
      }
      break

    default:
      errors.push('Invalid connection mode. Must be credentials, oauth, or keypair')
  }

  return errors
}

/**
 * Validate operation-specific parameters
 */
export function validateOperationParams(params: SnowflakeParams): string[] {
  const errors: string[] = []

  switch (params.operation) {
    case 'query':
      if (!params.sqlQuery?.trim()) {
        errors.push('SQL query is required for query operation')
      }
      break

    case 'insert':
      if (!params.tableName?.trim()) {
        errors.push('Table name is required for insert operation')
      }
      if (!params.insertData) {
        errors.push('Insert data is required for insert operation')
      }
      break

    case 'update':
      if (!params.tableName?.trim()) {
        errors.push('Table name is required for update operation')
      }
      if (!params.updateData) {
        errors.push('Update data is required for update operation')
      }
      break

    case 'delete':
      if (!params.tableName?.trim()) {
        errors.push('Table name is required for delete operation')
      }
      break

    case 'create_table':
    case 'drop_table':
    case 'truncate':
      if (!params.sqlQuery?.trim()) {
        errors.push('SQL query is required for table operations')
      }
      break

    case 'bulk_load':
      if (!params.tableName?.trim()) {
        errors.push('Table name is required for bulk load operation')
      }
      if (!params.stageName?.trim()) {
        errors.push('Stage name is required for bulk load operation')
      }
      break

    case 'procedure':
      if (!params.procedureName?.trim()) {
        errors.push('Procedure name is required for procedure operation')
      }
      break

    case 'schema_info':
      if (!params.schemaTable?.trim()) {
        errors.push('Table name is required for schema info operation')
      }
      break

    case 'test_connection':
    case 'list_tables':
      // No additional parameters required
      break

    default:
      errors.push('Invalid operation specified')
  }

  return errors
}

/**
 * Build Snowflake connection string
 */
export function buildConnectionString(params: SnowflakeConnectionParams): string {
  let connectionString = `snowflake://${params.username}@${params.accountName}`

  if (params.database) {
    connectionString += `/${params.database}`

    if (params.schema) {
      connectionString += `/${params.schema}`
    }
  }

  // Add warehouse parameter
  connectionString += `?warehouse=${params.warehouse}`

  // Add role if specified
  if (params.role) {
    connectionString += `&role=${params.role}`
  }

  return connectionString
}

/**
 * Sanitize SQL query for logging purposes
 */
export function sanitizeQuery(query: string): string {
  // Remove sensitive data patterns for logging
  return query
    .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
    .replace(/password\s*=\s*"[^"]*"/gi, 'password="***"')
    .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
    .replace(/token\s*=\s*"[^"]*"/gi, 'token="***"')
}

/**
 * Generate parameterized query
 */
export function buildParameterizedQuery(
  query: string,
  parameters: Record<string, any>
): { query: string; params: any[] } {
  const paramValues: any[] = []
  let paramIndex = 1

  // Replace named parameters with positional parameters
  const processedQuery = query.replace(/:\w+/g, (match) => {
    const paramName = match.slice(1) // Remove the ':'
    if (paramName in parameters) {
      paramValues.push(parameters[paramName])
      return `$${paramIndex++}`
    }
    return match
  })

  return {
    query: processedQuery,
    params: paramValues,
  }
}

/**
 * Format data for insertion
 */
export function formatInsertData(data: any, dataMode: string): any {
  switch (dataMode) {
    case 'json':
      return Array.isArray(data) ? data : [data]

    case 'pairs':
      // Convert key-value pairs to object
      if (typeof data === 'object' && !Array.isArray(data)) {
        return [data]
      }
      return data

    case 'sql':
      // Data is already in SQL format
      return data

    default:
      return data
  }
}

/**
 * Build INSERT SQL statement
 */
export function buildInsertQuery(tableName: string, data: Record<string, any>[]): string {
  if (!data.length) {
    throw new Error('No data provided for insert operation')
  }

  const firstRow = data[0]
  const columns = Object.keys(firstRow)
  const columnList = columns.map((col) => `"${col}"`).join(', ')

  const valueRows = data.map((row) => {
    const values = columns.map((col) => {
      const value = row[col]
      if (value === null || value === undefined) {
        return 'NULL'
      }
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`
      }
      if (typeof value === 'boolean') {
        return value.toString().toUpperCase()
      }
      if (value instanceof Date) {
        return `'${value.toISOString()}'`
      }
      return value.toString()
    })
    return `(${values.join(', ')})`
  })

  return `INSERT INTO ${tableName} (${columnList}) VALUES ${valueRows.join(', ')}`
}

/**
 * Build UPDATE SQL statement
 */
export function buildUpdateQuery(
  tableName: string,
  updateData: Record<string, any>,
  whereClause?: string
): string {
  const setClause = Object.entries(updateData)
    .map(([key, value]) => {
      if (value === null || value === undefined) {
        return `"${key}" = NULL`
      }
      if (typeof value === 'string') {
        return `"${key}" = '${value.replace(/'/g, "''")}'`
      }
      if (typeof value === 'boolean') {
        return `"${key}" = ${value.toString().toUpperCase()}`
      }
      if (value instanceof Date) {
        return `"${key}" = '${value.toISOString()}'`
      }
      return `"${key}" = ${value}`
    })
    .join(', ')

  let query = `UPDATE ${tableName} SET ${setClause}`

  if (whereClause) {
    query += ` WHERE ${whereClause}`
  }

  return query
}

/**
 * Build DELETE SQL statement
 */
export function buildDeleteQuery(tableName: string, whereClause?: string): string {
  let query = `DELETE FROM ${tableName}`

  if (whereClause) {
    query += ` WHERE ${whereClause}`
  }

  return query
}

/**
 * Apply pagination to query
 */
export function applyPagination(query: string, pageSize: number, pageNumber: number): string {
  const offset = (pageNumber - 1) * pageSize
  return `${query} LIMIT ${pageSize} OFFSET ${offset}`
}

/**
 * Extract table schema from Snowflake result
 */
export function extractTableSchema(results: any[]): SnowflakeTableSchema {
  if (!results.length) {
    throw new Error('No schema information returned')
  }

  const columns: SnowflakeColumnInfo[] = results.map((row) => ({
    name: row.COLUMN_NAME || row.column_name,
    type: row.DATA_TYPE || row.data_type,
    nullable: (row.IS_NULLABLE || row.is_nullable) === 'YES',
    default: row.COLUMN_DEFAULT || row.column_default,
    primaryKey: (row.IS_PRIMARY_KEY || row.is_primary_key) === 'YES',
    comment: row.COMMENT || row.comment,
  }))

  return {
    tableName: results[0].TABLE_NAME || results[0].table_name,
    columns,
  }
}

/**
 * Format query results based on output format
 */
export function formatQueryResults(results: any[], outputFormat: string): any {
  switch (outputFormat) {
    case 'json':
      return results

    case 'csv': {
      if (!results.length) return ''

      const headers = Object.keys(results[0])
      const csvHeaders = headers.join(',')
      const csvRows = results.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value.toString()
          })
          .join(',')
      )
      return [csvHeaders, ...csvRows].join('\n')
    }

    case 'table':
      return {
        headers: results.length > 0 ? Object.keys(results[0]) : [],
        rows: results,
      }
    default:
      return results
  }
}

/**
 * Calculate query execution metrics
 */
export function calculateMetrics(
  startTime: Date,
  endTime: Date,
  rowCount: number,
  operation: string
): SnowflakeMetrics {
  const executionTime = endTime.getTime() - startTime.getTime()

  return {
    queryCount: 1,
    totalExecutionTime: executionTime,
    averageExecutionTime: executionTime,
    errorCount: 0,
    connectionCount: 1,
    lastQueryTime: endTime,
  }
}

/**
 * Generate unique connection pool key
 */
export function generateConnectionKey(params: SnowflakeConnectionParams): string {
  return `${params.accountName}_${params.database}_${params.warehouse}_${params.schema}_${params.username}`
}

/**
 * Validate bulk load options
 */
export function validateBulkLoadOptions(options: SnowflakeBulkLoadOptions): string[] {
  const errors: string[] = []

  if (!options.stageName?.trim()) {
    errors.push('Stage name is required for bulk load')
  }

  if (!options.fileFormat?.trim()) {
    errors.push('File format is required for bulk load')
  }

  const validFormats = ['csv', 'json', 'parquet', 'avro', 'xml']
  if (options.fileFormat && !validFormats.includes(options.fileFormat.toLowerCase())) {
    errors.push(`Invalid file format. Must be one of: ${validFormats.join(', ')}`)
  }

  return errors
}

/**
 * Build bulk load COPY INTO statement
 */
export function buildBulkLoadQuery(
  tableName: string,
  stageName: string,
  fileFormat: string,
  options?: Partial<SnowflakeBulkLoadOptions>
): string {
  let query = `COPY INTO ${tableName} FROM ${stageName}`

  if (fileFormat) {
    query += ` FILE_FORMAT = (TYPE = '${fileFormat.toUpperCase()}'`

    if (options?.skipHeader && fileFormat.toLowerCase() === 'csv') {
      query += ` SKIP_HEADER = 1`
    }

    if (options?.fieldDelimiter && fileFormat.toLowerCase() === 'csv') {
      query += ` FIELD_DELIMITER = '${options.fieldDelimiter}'`
    }

    if (options?.recordDelimiter && fileFormat.toLowerCase() === 'csv') {
      query += ` RECORD_DELIMITER = '${options.recordDelimiter}'`
    }

    query += ')'
  }

  return query
}
