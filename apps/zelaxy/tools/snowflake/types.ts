export interface SnowflakeConnectionParams {
  // Connection details
  accountName: string
  database: string
  warehouse: string
  schema: string
  role?: string

  // Authentication
  connectionMode: 'credentials' | 'oauth' | 'keypair'
  username?: string
  password?: string
  oauthToken?: string
  privateKey?: string
  privateKeyPassphrase?: string

  // Connection settings
  clientSessionKeepAlive?: boolean
  connectionTimeout?: number
  queryTimeout?: number
  enableConnectionPooling?: boolean
  maxConnections?: number
}

export interface SnowflakeOperationParams {
  operation:
    | 'query'
    | 'insert'
    | 'update'
    | 'delete'
    | 'create_table'
    | 'drop_table'
    | 'truncate'
    | 'bulk_load'
    | 'procedure'
    | 'schema_info'
    | 'list_tables'
    | 'test_connection'

  // SQL operations
  sqlQuery?: string
  tableName?: string

  // Data operations
  dataMode?: 'json' | 'pairs' | 'sql'
  insertData?: any
  updateData?: any
  whereClause?: string

  // Bulk load operations
  stageName?: string
  fileFormat?: 'csv' | 'json' | 'parquet' | 'avro' | 'xml'

  // Procedure operations
  procedureName?: string
  procedureParams?: any[]

  // Query options
  useParameterizedQuery?: boolean
  parameters?: Record<string, any>

  // Output options
  outputFormat?: 'json' | 'csv' | 'table' | 'raw'
  enablePagination?: boolean
  pageSize?: number
  pageNumber?: number

  // Advanced options
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  enableConnectionPooling?: boolean
  maxConnections?: number

  // Schema detection
  enableSchemaDetection?: boolean
  schemaTable?: string

  // Monitoring
  enableQueryLogging?: boolean
  enableMetrics?: boolean
}

export type SnowflakeParams = SnowflakeConnectionParams & SnowflakeOperationParams

export interface SnowflakeQueryResult {
  success: boolean
  data?: any[]
  rowCount?: number
  executionTime?: number
  queryId?: string

  // Schema information
  schema?: any
  tables?: any[]
  columns?: any[]

  // Pagination
  hasNextPage?: boolean
  totalPages?: number
  currentPage?: number

  // Connection info
  connectionInfo?: any
  warehouseInfo?: any

  // Metrics
  metrics?: any
  queryLog?: any[]

  // Error information
  error?: string
  sqlState?: string

  // Bulk operations
  uploadedFiles?: any[]
  stagingStatus?: any
  loadStatus?: any
}

export interface SnowflakeResponse {
  success: boolean
  data?: SnowflakeQueryResult
  output?: any
  error?: string
}

export interface SnowflakeConnectionPool {
  connections: Map<string, any>
  maxConnections: number
  activeConnections: number
}

export interface SnowflakeMetrics {
  queryCount: number
  totalExecutionTime: number
  averageExecutionTime: number
  errorCount: number
  connectionCount: number
  lastQueryTime?: Date
}

export interface SnowflakeTableSchema {
  tableName: string
  columns: SnowflakeColumnInfo[]
}

export interface SnowflakeColumnInfo {
  name: string
  type: string
  nullable: boolean
  default?: any
  primaryKey?: boolean
  comment?: string
}

export interface SnowflakeBulkLoadOptions {
  stageName: string
  fileFormat: string
  compressionType?: 'gzip' | 'bz2' | 'brotli' | 'zstd' | 'deflate' | 'raw_deflate'
  skipHeader?: boolean
  fieldDelimiter?: string
  recordDelimiter?: string
  skipBlankLines?: boolean
  dateFormat?: string
  timeFormat?: string
  timestampFormat?: string
}

export interface SnowflakeStageInfo {
  name: string
  type: 'internal' | 'external'
  location?: string
  fileFormat?: string
  copyOptions?: Record<string, any>
}

export interface SnowflakeWarehouseInfo {
  name: string
  size: string
  state: 'STARTED' | 'SUSPENDED' | 'RESIZING'
  type: string
  runningQueries: number
  queuedQueries: number
}
