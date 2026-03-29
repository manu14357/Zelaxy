import { type NextRequest, NextResponse } from 'next/server'
import type { SnowflakeParams, SnowflakeResponse } from '@/tools/snowflake/types'
import {
  applyPagination,
  buildBulkLoadQuery,
  buildDeleteQuery,
  buildInsertQuery,
  buildParameterizedQuery,
  buildUpdateQuery,
  extractTableSchema,
  formatInsertData,
  formatQueryResults,
  generateConnectionKey,
  sanitizeQuery,
  validateConnectionParams,
  validateOperationParams,
} from '@/tools/snowflake/utils'

// Connection pool for reusing Snowflake connections
const connectionPool = new Map<string, any>()
const connectionMetrics = new Map<string, any>()

/**
 * Create Snowflake connection configuration
 */
function createConnectionConfig(params: SnowflakeParams) {
  const config: any = {
    account: params.accountName,
    database: params.database,
    warehouse: params.warehouse,
    schema: params.schema,
    application: 'zelaxy-platform',
    connectTimeout: (params.connectionTimeout || 60) * 1000,
    networkTimeout: (params.queryTimeout || 300) * 1000,
    clientSessionKeepAlive: params.clientSessionKeepAlive || false,
  }

  // Add role if specified
  if (params.role) {
    config.role = params.role
  }

  // Configure authentication based on connection mode
  switch (params.connectionMode) {
    case 'credentials':
      config.username = params.username
      config.password = params.password
      break

    case 'oauth':
      config.token = params.oauthToken
      break

    case 'keypair':
      config.username = params.username
      config.privateKey = params.privateKey
      if (params.privateKeyPassphrase) {
        config.privateKeyPassphrase = params.privateKeyPassphrase
      }
      config.authenticator = 'SNOWFLAKE_JWT'
      break

    default:
      throw new Error(`Unsupported connection mode: ${params.connectionMode}`)
  }

  return config
}

/**
 * Get or create a Snowflake connection
 */
async function getConnection(params: SnowflakeParams) {
  const connectionKey = generateConnectionKey(params)

  if (params.enableConnectionPooling && connectionPool.has(connectionKey)) {
    const existingConnection = connectionPool.get(connectionKey)
    if (existingConnection?.isValidAsync) {
      const isValid = await existingConnection.isValidAsync()
      if (isValid) {
        return existingConnection
      }
      connectionPool.delete(connectionKey)
    }
  }

  // Create new connection
  let snowflake: any
  try {
    snowflake = require('snowflake-sdk')
    console.log('Snowflake SDK loaded successfully')
  } catch (error) {
    console.error('Failed to load Snowflake SDK:', error)
    throw new Error('Snowflake SDK not found. Please install snowflake-sdk package.')
  }

  const config = createConnectionConfig(params)

  // Log sanitized connection config (without sensitive data)
  console.log('Snowflake Connection Config:', {
    account: config.account,
    database: config.database,
    warehouse: config.warehouse,
    schema: config.schema,
    username: config.username ? '***' : undefined,
    role: config.role,
    application: config.application,
  })

  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(config)

    connection.connect((err: any, conn: any) => {
      if (err) {
        // Enhanced error logging
        console.error('Snowflake Connection Error:', {
          message: err.message,
          code: err.code,
          sqlState: err.sqlState,
          data: err.data,
          account: params.accountName,
          database: params.database,
          warehouse: params.warehouse,
          isBrowserEnv: err.isBrowserEnv,
          response: err.response?.data,
          stack: err.stack,
        })

        // Provide more helpful error messages based on error codes
        let errorMessage = `Failed to connect to Snowflake: ${err.message}`

        if (err.code === '390144') {
          errorMessage +=
            '. Invalid account name format. Account should be in format: account_identifier (e.g., xy12345.region.cloud_provider or xy12345)'
        } else if (err.code === '390201') {
          errorMessage += '. Authentication failed. Please verify your username and password.'
        } else if (err.code === '390100') {
          errorMessage +=
            '. Unable to reach Snowflake. Check your network connection and account URL.'
        } else if (err.code === 401002) {
          errorMessage = `Request to Snowflake failed after connection (Code: 401002). This usually indicates:`
          errorMessage += `\n- Warehouse '${params.warehouse}' may not exist, is suspended, or you lack privileges`
          errorMessage += `\n- Database '${params.database}' may not exist or you lack access`
          errorMessage += `\n- Schema '${params.schema}' may not exist or you lack access`
          errorMessage += `\n- Resource names are case-sensitive in Snowflake`
          errorMessage += `\n- Try using uppercase names or grant appropriate privileges`
        }

        errorMessage += ` [Code: ${err.code || 'N/A'}]`

        reject(new Error(errorMessage))
        return
      }

      console.log('✓ Snowflake connection established successfully')
      console.log('  Account:', params.accountName)
      console.log('  Warehouse:', params.warehouse)
      console.log('  Database:', params.database)
      console.log('  Schema:', params.schema)
      console.log('  Note: Resource names in Snowflake are case-sensitive')

      if (params.enableConnectionPooling) {
        connectionPool.set(connectionKey, conn)

        // Clean up connection after timeout
        setTimeout(
          () => {
            if (connectionPool.has(connectionKey)) {
              conn.destroy(() => {})
              connectionPool.delete(connectionKey)
            }
          },
          5 * 60 * 1000
        ) // 5 minutes
      }

      resolve(conn)
    })
  })
}

/**
 * Execute SQL query with error handling and retry logic
 */
async function executeQuery(
  connection: any,
  query: string,
  params: SnowflakeParams,
  binds?: any[]
): Promise<any> {
  const startTime = new Date()

  return new Promise((resolve, reject) => {
    const executeOptions: any = {
      sqlText: query,
      complete: (err: any, stmt: any, rows: any) => {
        const endTime = new Date()
        const executionTime = endTime.getTime() - startTime.getTime()

        if (err) {
          // Enhanced error logging with more details
          console.error(`Snowflake Query Failed:`, {
            query: sanitizeQuery(query),
            error: err.message,
            code: err.code,
            sqlState: err.sqlState,
            executionTime,
            data: err.data,
            response: err.response?.data,
            cause: err.cause,
          })

          // Provide more helpful error messages based on error codes
          let errorMessage = `Query execution failed: ${err.message}`

          if (err.code === '401002') {
            errorMessage +=
              '. This may indicate: 1) The warehouse is suspended or unavailable, 2) Missing permissions on database/schema/warehouse, 3) Resource names are case-sensitive - verify exact casing of WAREHOUSE, DATABASE, and SCHEMA names in Snowflake.'
            errorMessage += ` Please verify: WAREHOUSE="${params.warehouse}", DATABASE="${params.database}", SCHEMA="${params.schema}"`
          } else if (err.code === '002003') {
            errorMessage += '. Object does not exist or not authorized.'
          } else if (err.code === '002043') {
            errorMessage += '. SQL compilation error - check your query syntax.'
          }

          errorMessage += ` [Code: ${err.code || 'N/A'}]`

          reject(new Error(errorMessage))
          return
        }

        // Log successful query if enabled
        if (params.enableQueryLogging) {
          console.log(`Snowflake Query Executed:`, {
            query: sanitizeQuery(query),
            rowCount: rows?.length || 0,
            executionTime,
            queryId: stmt.getStatementId(),
          })
        }

        resolve({
          rows: rows || [],
          statement: stmt,
          executionTime,
          queryId: stmt.getStatementId(),
        })
      },
    }

    // Add parameter binds if provided
    if (binds && binds.length > 0) {
      executeOptions.binds = binds
    }

    connection.execute(executeOptions)
  })
}

/**
 * Handle retry logic for failed operations
 */
async function withRetry<T>(operation: () => Promise<T>, params: SnowflakeParams): Promise<T> {
  if (!params.enableRetry) {
    return operation()
  }

  const maxRetries = params.maxRetries || 3
  const retryDelay = params.retryDelay || 1000

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        break
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
    }
  }

  throw lastError
}

/**
 * Handle test connection operation
 */
async function handleTestConnection(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const connection = await getConnection(params)
    const result = await executeQuery(connection, 'SELECT CURRENT_VERSION() as version', params)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        data: result.rows,
        connectionInfo: {
          version: result.rows[0]?.VERSION,
          account: params.accountName,
          database: params.database,
          warehouse: params.warehouse,
          schema: params.schema,
          connected: true,
        },
        executionTime: result.executionTime,
        queryId: result.queryId,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
        connectionInfo: { connected: false },
      },
    }
  }
}

/**
 * Handle query execution operation
 */
async function handleQuery(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    let query = params.sqlQuery!
    let binds: any[] | undefined

    // Handle parameterized queries
    if (params.useParameterizedQuery && params.parameters) {
      const parameterized = buildParameterizedQuery(query, params.parameters)
      query = parameterized.query
      binds = parameterized.params
    }

    // Apply pagination if enabled
    if (params.enablePagination) {
      query = applyPagination(query, params.pageSize || 1000, params.pageNumber || 1)
    }

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params, binds)

    // Format results based on output format
    const formattedData = formatQueryResults(result.rows, params.outputFormat || 'json')

    // Calculate pagination info
    const hasNextPage = params.enablePagination && result.rows.length === (params.pageSize || 1000)
    const totalPages = hasNextPage ? (params.pageNumber || 1) + 1 : params.pageNumber || 1

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        data: formattedData,
        rowCount: result.rows.length,
        executionTime: result.executionTime,
        queryId: result.queryId,
        hasNextPage,
        totalPages,
        currentPage: params.pageNumber || 1,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle insert operation
 */
async function handleInsert(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const formattedData = formatInsertData(params.insertData, params.dataMode || 'json')
    const query = buildInsertQuery(params.tableName!, formattedData)

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        rowCount: formattedData.length,
        executionTime: result.executionTime,
        queryId: result.queryId,
        data: formattedData,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle update operation
 */
async function handleUpdate(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const query = buildUpdateQuery(params.tableName!, params.updateData!, params.whereClause)

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        rowCount: result.statement?.getNumUpdatedRows?.() || 0,
        executionTime: result.executionTime,
        queryId: result.queryId,
        data: [
          {
            message: 'Update completed successfully',
            affectedRows: result.statement?.getNumUpdatedRows?.() || 0,
          },
        ],
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle delete operation
 */
async function handleDelete(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const query = buildDeleteQuery(params.tableName!, params.whereClause)

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        rowCount: result.statement?.getNumUpdatedRows?.() || 0,
        executionTime: result.executionTime,
        queryId: result.queryId,
        data: [
          {
            message: 'Delete completed successfully',
            affectedRows: result.statement?.getNumUpdatedRows?.() || 0,
          },
        ],
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle bulk load operation
 */
async function handleBulkLoad(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const query = buildBulkLoadQuery(params.tableName!, params.stageName!, params.fileFormat!)

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        data: result.rows,
        executionTime: result.executionTime,
        queryId: result.queryId,
        loadStatus: { message: 'Bulk load completed successfully' },
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle stored procedure execution
 */
async function handleProcedure(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const procParams = params.procedureParams || []
    const paramPlaceholders = procParams.map(() => '?').join(', ')
    const query = `CALL ${params.procedureName}(${paramPlaceholders})`

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params, procParams)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        data: result.rows,
        executionTime: result.executionTime,
        queryId: result.queryId,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle schema information retrieval
 */
async function handleSchemaInfo(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const query = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${params.schema}' 
      AND TABLE_NAME = '${params.schemaTable}'
      ORDER BY ORDINAL_POSITION
    `

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params)

    const schema = extractTableSchema(result.rows)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        schema,
        data: result.rows,
        executionTime: result.executionTime,
        queryId: result.queryId,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Handle list tables operation
 */
async function handleListTables(params: SnowflakeParams): Promise<SnowflakeResponse> {
  try {
    const query = `
      SELECT 
        TABLE_NAME,
        TABLE_TYPE,
        ROW_COUNT,
        BYTES,
        COMMENT
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${params.schema}'
      ORDER BY TABLE_NAME
    `

    const connection = await getConnection(params)
    const result = await executeQuery(connection, query, params)

    if (!params.enableConnectionPooling) {
      connection.destroy(() => {})
    }

    return {
      success: true,
      data: {
        success: true,
        tables: result.rows,
        data: result.rows,
        executionTime: result.executionTime,
        queryId: result.queryId,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        success: false,
        error: (error as Error).message,
      },
    }
  }
}

/**
 * Main POST handler for Snowflake operations
 */
export async function POST(request: NextRequest) {
  try {
    const params: SnowflakeParams = await request.json()

    // Validate connection parameters
    const connectionErrors = validateConnectionParams(params)
    if (connectionErrors.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          success: false,
          error: `Connection validation failed: ${connectionErrors.join(', ')}`,
        },
      })
    }

    // Validate operation parameters
    const operationErrors = validateOperationParams(params)
    if (operationErrors.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          success: false,
          error: `Operation validation failed: ${operationErrors.join(', ')}`,
        },
      })
    }

    // Handle different operations with retry logic
    const operation = async () => {
      switch (params.operation) {
        case 'test_connection':
          return handleTestConnection(params)
        case 'query':
          return handleQuery(params)
        case 'insert':
          return handleInsert(params)
        case 'update':
          return handleUpdate(params)
        case 'delete':
          return handleDelete(params)
        case 'create_table':
        case 'drop_table':
        case 'truncate':
          return handleQuery(params) // These are essentially query operations
        case 'bulk_load':
          return handleBulkLoad(params)
        case 'procedure':
          return handleProcedure(params)
        case 'schema_info':
          return handleSchemaInfo(params)
        case 'list_tables':
          return handleListTables(params)
        default:
          return {
            success: true,
            data: {
              success: false,
              error: `Unsupported operation: ${params.operation}`,
            },
          }
      }
    }

    const result = await withRetry(operation, params)

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json({
      success: true,
      data: {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    })
  }
}
