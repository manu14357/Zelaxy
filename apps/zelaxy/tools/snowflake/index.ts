import type { ToolConfig } from '@/tools/types'
import type { SnowflakeParams, SnowflakeResponse } from './types'

export const snowflakeTool: ToolConfig<SnowflakeParams, SnowflakeResponse> = {
  id: 'snowflake_connector',
  name: 'Snowflake Data Warehouse',
  description:
    'Connect to Snowflake Data Warehouse and execute SQL operations with advanced features',
  version: '1.0.0',

  params: {
    // Connection parameters
    accountName: {
      type: 'string',
      required: true,
      description: 'Snowflake account name (e.g., mycompany.eu-central-1)',
    },
    database: {
      type: 'string',
      required: true,
      description: 'Database name',
    },
    warehouse: {
      type: 'string',
      required: true,
      description: 'Virtual warehouse name',
    },
    schema: {
      type: 'string',
      required: true,
      description: 'Schema name',
    },
    role: {
      type: 'string',
      required: false,
      description: 'Security role to assume',
    },

    // Authentication
    connectionMode: {
      type: 'string',
      required: false,
      default: 'credentials',
      description: 'Authentication method: credentials, oauth, or keypair',
    },
    username: {
      type: 'string',
      required: false,
      description: 'Username for credential authentication',
    },
    password: {
      type: 'string',
      required: false,
      description: 'Password for credential authentication',
    },
    oauthToken: {
      type: 'string',
      required: false,
      description: 'OAuth token for OAuth authentication',
    },
    privateKey: {
      type: 'string',
      required: false,
      description: 'RSA private key for key pair authentication',
    },
    privateKeyPassphrase: {
      type: 'string',
      required: false,
      description: 'Passphrase for encrypted private key',
    },

    // Connection settings
    clientSessionKeepAlive: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Keep session alive indefinitely',
    },
    connectionTimeout: {
      type: 'number',
      required: false,
      default: 60,
      description: 'Connection timeout in seconds',
    },
    queryTimeout: {
      type: 'number',
      required: false,
      default: 300,
      description: 'Query execution timeout in seconds',
    },

    // Operation
    operation: {
      type: 'string',
      required: true,
      description:
        'Operation to perform: query, insert, update, delete, create_table, drop_table, truncate, bulk_load, procedure, schema_info, list_tables, test_connection',
    },

    // SQL operations
    sqlQuery: {
      type: 'string',
      required: false,
      description: 'SQL query to execute',
    },
    tableName: {
      type: 'string',
      required: false,
      description: 'Target table name',
    },

    // Data operations
    dataMode: {
      type: 'string',
      required: false,
      default: 'json',
      description: 'Data input format: json, pairs, or sql',
    },
    insertData: {
      type: 'object',
      required: false,
      description: 'Data to insert (object or array of objects)',
    },
    updateData: {
      type: 'object',
      required: false,
      description: 'Data to update (key-value pairs)',
    },
    whereClause: {
      type: 'string',
      required: false,
      description: 'WHERE clause for update/delete operations',
    },

    // Bulk load operations
    stageName: {
      type: 'string',
      required: false,
      description: 'Stage name for bulk operations',
    },
    fileFormat: {
      type: 'string',
      required: false,
      description: 'File format: csv, json, parquet, avro, xml',
    },

    // Procedure operations
    procedureName: {
      type: 'string',
      required: false,
      description: 'Stored procedure name',
    },
    procedureParams: {
      type: 'array',
      required: false,
      description: 'Procedure parameters array',
    },

    // Query options
    useParameterizedQuery: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Use parameterized queries for security',
    },
    parameters: {
      type: 'object',
      required: false,
      description: 'Query parameters for parameterized queries',
    },

    // Output options
    outputFormat: {
      type: 'string',
      required: false,
      default: 'json',
      description: 'Output format: json, csv, table, raw',
    },
    enablePagination: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable result pagination',
    },
    pageSize: {
      type: 'number',
      required: false,
      default: 1000,
      description: 'Number of rows per page',
    },
    pageNumber: {
      type: 'number',
      required: false,
      default: 1,
      description: 'Page number to retrieve',
    },

    // Advanced options
    enableRetry: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable retry on failure',
    },
    maxRetries: {
      type: 'number',
      required: false,
      default: 3,
      description: 'Maximum number of retries',
    },
    retryDelay: {
      type: 'number',
      required: false,
      default: 1000,
      description: 'Delay between retries in milliseconds',
    },
    enableConnectionPooling: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable connection pooling',
    },
    maxConnections: {
      type: 'number',
      required: false,
      default: 10,
      description: 'Maximum number of pooled connections',
    },

    // Schema detection
    enableSchemaDetection: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable automatic schema detection',
    },
    schemaTable: {
      type: 'string',
      required: false,
      description: 'Table for schema detection',
    },

    // Monitoring
    enableQueryLogging: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable query logging',
    },
    enableMetrics: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable performance metrics collection',
    },
  },

  outputs: {
    success: {
      type: 'boolean',
      description: 'Whether the operation was successful',
    },
    data: {
      type: 'object',
      description: 'Complete operation result data',
    },
    error: {
      type: 'string',
      description: 'Error message if operation failed',
    },
  },

  request: {
    url: '/api/tools/snowflake',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: SnowflakeParams) => params,
  },

  transformResponse: async (response: Response): Promise<SnowflakeResponse> => {
    const jsonData = await response.json()

    if (!jsonData.success || !jsonData.data) {
      return {
        success: false,
        output: {
          success: false,
          error: jsonData.error || 'Unknown error occurred',
          data: null,
          rowCount: 0,
          executionTime: 0,
          queryId: null,
        },
      }
    }

    // Transform nested response to flat structure for block outputs
    const data = jsonData.data
    return {
      success: true,
      output: {
        success: data.success || false,
        data: data.data || null,
        rowCount: data.rowCount || 0,
        executionTime: data.executionTime || 0,
        queryId: data.queryId || null,
        error: data.error || null,

        // Schema information
        schema: data.schema || null,
        tables: data.tables || null,
        columns: data.columns || null,

        // Pagination
        hasNextPage: data.hasNextPage || false,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,

        // Connection info
        connectionInfo: data.connectionInfo || null,
        warehouseInfo: data.warehouseInfo || null,

        // Metrics
        metrics: data.metrics || null,
        queryLog: data.queryLog || null,

        // Bulk operations
        loadStatus: data.loadStatus || null,
      },
    }
  },
}
