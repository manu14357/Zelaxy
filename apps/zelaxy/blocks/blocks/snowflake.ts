import { SnowflakeIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const SnowflakeBlock: BlockConfig = {
  type: 'snowflake',
  name: 'Snowflake',
  description: 'Connect to Snowflake Data Warehouse and execute SQL operations',
  longDescription:
    'Connect to your Snowflake Data Warehouse to execute SQL queries, insert/update data, manage tables, and perform advanced data operations. Supports dynamic schema detection, parameterized queries, bulk operations, and connection pooling.',
  docsLink: 'https://docs.snowflake.com/',
  category: 'tools',
  bgColor: '#29B5E8',
  icon: SnowflakeIcon,
  subBlocks: [
    // Connection Configuration
    {
      id: 'connectionMode',
      title: 'Connection Mode',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Credentials', id: 'credentials' },
        { label: 'OAuth', id: 'oauth' },
        { label: 'Key Pair', id: 'keypair' },
      ],
      value: () => 'credentials',
    },
    {
      id: 'accountName',
      title: 'Account Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'e.g. mycompany.eu-central-1',
      required: true,
      description: 'Your Snowflake account identifier',
    },
    {
      id: 'database',
      title: 'Database',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Database name',
      required: true,
    },
    {
      id: 'warehouse',
      title: 'Warehouse',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Virtual warehouse name',
      required: true,
    },
    {
      id: 'schema',
      title: 'Schema',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Schema name',
      required: true,
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Snowflake username',
      required: true,
      condition: {
        field: 'connectionMode',
        value: 'credentials',
      },
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Password',
      password: true,
      required: true,
      condition: {
        field: 'connectionMode',
        value: 'credentials',
      },
    },
    {
      id: 'role',
      title: 'Role',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Security role (optional)',
      description: 'Snowflake security role to assume',
    },
    {
      id: 'oauthToken',
      title: 'OAuth Token',
      type: 'oauth-input',
      layout: 'full',
      provider: 'snowflake',
      required: true,
      condition: {
        field: 'connectionMode',
        value: 'oauth',
      },
    },
    {
      id: 'privateKey',
      title: 'Private Key',
      type: 'long-input',
      layout: 'full',
      placeholder: 'RSA private key for key pair authentication',
      password: true,
      required: true,
      condition: {
        field: 'connectionMode',
        value: 'keypair',
      },
    },
    {
      id: 'privateKeyPassphrase',
      title: 'Private Key Passphrase',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Passphrase for private key (if encrypted)',
      password: true,
      condition: {
        field: 'connectionMode',
        value: 'keypair',
      },
    },

    // Advanced Connection Settings
    {
      id: 'clientSessionKeepAlive',
      title: 'Keep Session Alive',
      type: 'switch',
      layout: 'half',
      description: 'Keep the session alive indefinitely',
    },
    {
      id: 'connectionTimeout',
      title: 'Connection Timeout (seconds)',
      type: 'slider',
      layout: 'half',
      min: 30,
      max: 300,
      value: () => '60',
      description: 'Connection timeout in seconds',
    },
    {
      id: 'queryTimeout',
      title: 'Query Timeout (seconds)',
      type: 'slider',
      layout: 'half',
      min: 30,
      max: 3600,
      value: () => '300',
      description: 'Query execution timeout in seconds',
    },

    // Operation Configuration
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Execute Query', id: 'query' },
        { label: 'Insert Rows', id: 'insert' },
        { label: 'Update Rows', id: 'update' },
        { label: 'Delete Rows', id: 'delete' },
        { label: 'Create Table', id: 'create_table' },
        { label: 'Drop Table', id: 'drop_table' },
        { label: 'Truncate Table', id: 'truncate' },
        { label: 'Bulk Load', id: 'bulk_load' },
        { label: 'Execute Procedure', id: 'procedure' },
        { label: 'Get Schema Info', id: 'schema_info' },
        { label: 'List Tables', id: 'list_tables' },
        { label: 'Test Connection', id: 'test_connection' },
      ],
      required: true,
    },

    // SQL Query Configuration
    {
      id: 'sqlQuery',
      title: 'SQL Query',
      type: 'code',
      layout: 'full',
      language: 'javascript',
      placeholder: 'SELECT * FROM my_table LIMIT 100;',
      required: true,
      condition: {
        field: 'operation',
        value: ['query', 'create_table', 'drop_table', 'truncate'],
      },
      wandConfig: {
        enabled: true,
        prompt:
          'You are a Snowflake SQL expert. Generate a syntactically correct Snowflake SQL query based on the user requirements. Consider Snowflake-specific features like:\n\n- Use proper quoting for identifiers with ""\n- Snowflake functions like CURRENT_TIMESTAMP, DATEADD, DATEDIFF\n- Snowflake data types like VARIANT for JSON\n- Window functions and CTEs\n- Proper JOIN syntax\n- LIMIT clause for large results\n\nReturn only the SQL query without explanations.',
        generationType: 'javascript-function-body',
        placeholder:
          'Describe the SQL query you need (e.g., "Get top 10 customers by revenue this month")',
        maintainHistory: true,
      },
    },

    // Table Operations
    {
      id: 'tableName',
      title: 'Table Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'table_name or schema.table_name',
      required: true,
      condition: {
        field: 'operation',
        value: ['insert', 'update', 'delete', 'drop_table', 'truncate', 'bulk_load'],
      },
    },

    // Insert/Update Data
    {
      id: 'dataMode',
      title: 'Data Mode',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'JSON Object', id: 'json' },
        { label: 'Key-Value Pairs', id: 'pairs' },
        { label: 'SQL Values', id: 'sql' },
      ],
      condition: {
        field: 'operation',
        value: ['insert', 'update'],
      },
    },
    {
      id: 'insertData',
      title: 'Insert Data',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder:
        '{\n  "column1": "value1",\n  "column2": "value2"\n}\n\n// Or for multiple rows:\n[\n  {"column1": "value1", "column2": "value2"},\n  {"column1": "value3", "column2": "value4"}\n]',
      condition: {
        field: 'operation',
        value: 'insert',
        and: {
          field: 'dataMode',
          value: 'json',
        },
      },
    },
    {
      id: 'updateData',
      title: 'Update Data (SET clause)',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{\n  "column1": "new_value1",\n  "column2": "new_value2"\n}',
      condition: {
        field: 'operation',
        value: 'update',
        and: {
          field: 'dataMode',
          value: 'json',
        },
      },
    },
    {
      id: 'whereClause',
      title: 'WHERE Clause',
      type: 'short-input',
      layout: 'full',
      placeholder: 'id = 123 AND status = "active"',
      condition: {
        field: 'operation',
        value: ['update', 'delete'],
      },
    },

    // Bulk Load Configuration
    {
      id: 'stageName',
      title: 'Stage Name',
      type: 'short-input',
      layout: 'half',
      placeholder: '@my_stage or @%table_name',
      condition: {
        field: 'operation',
        value: 'bulk_load',
      },
    },
    {
      id: 'fileFormat',
      title: 'File Format',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'CSV', id: 'csv' },
        { label: 'JSON', id: 'json' },
        { label: 'Parquet', id: 'parquet' },
        { label: 'Avro', id: 'avro' },
        { label: 'XML', id: 'xml' },
      ],
      condition: {
        field: 'operation',
        value: 'bulk_load',
      },
    },

    // Procedure Configuration
    {
      id: 'procedureName',
      title: 'Procedure Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'procedure_name',
      condition: {
        field: 'operation',
        value: 'procedure',
      },
    },
    {
      id: 'procedureParams',
      title: 'Procedure Parameters',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '["param1", "param2", 123]',
      condition: {
        field: 'operation',
        value: 'procedure',
      },
    },

    // Query Options
    {
      id: 'useParameterizedQuery',
      title: 'Use Parameterized Query',
      type: 'switch',
      layout: 'half',
      description: 'Use parameterized queries for security',
      condition: {
        field: 'operation',
        value: ['query', 'insert', 'update', 'delete'],
      },
    },
    {
      id: 'parameters',
      title: 'Query Parameters',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: '{\n  "param1": "value1",\n  "param2": 123\n}',
      condition: {
        field: 'useParameterizedQuery',
        value: true,
      },
    },

    // Result Options
    {
      id: 'outputFormat',
      title: 'Output Format',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'JSON', id: 'json' },
        { label: 'CSV', id: 'csv' },
        { label: 'Table Preview', id: 'table' },
        { label: 'Raw Result', id: 'raw' },
      ],
      value: () => 'json',
      condition: {
        field: 'operation',
        value: ['query', 'schema_info', 'list_tables'],
      },
    },
    {
      id: 'enablePagination',
      title: 'Enable Pagination',
      type: 'switch',
      layout: 'half',
      description: 'Paginate large result sets',
      condition: {
        field: 'operation',
        value: 'query',
      },
    },
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'slider',
      layout: 'half',
      min: 10,
      max: 10000,
      value: () => '1000',
      condition: {
        field: 'enablePagination',
        value: true,
      },
    },
    {
      id: 'pageNumber',
      title: 'Page Number',
      type: 'slider',
      layout: 'half',
      min: 1,
      max: 1000,
      value: () => '1',
      condition: {
        field: 'enablePagination',
        value: true,
      },
    },

    // Advanced Options
    {
      id: 'enableRetry',
      title: 'Enable Retry',
      type: 'switch',
      layout: 'half',
      description: 'Retry failed operations',
    },
    {
      id: 'maxRetries',
      title: 'Max Retries',
      type: 'slider',
      layout: 'half',
      min: 1,
      max: 10,
      value: () => '3',
      condition: {
        field: 'enableRetry',
        value: true,
      },
    },
    {
      id: 'retryDelay',
      title: 'Retry Delay (ms)',
      type: 'slider',
      layout: 'half',
      min: 100,
      max: 10000,
      value: () => '1000',
      condition: {
        field: 'enableRetry',
        value: true,
      },
    },
    {
      id: 'enableConnectionPooling',
      title: 'Enable Connection Pooling',
      type: 'switch',
      layout: 'half',
      description: 'Reuse database connections for performance',
    },
    {
      id: 'maxConnections',
      title: 'Max Connections',
      type: 'slider',
      layout: 'half',
      min: 1,
      max: 50,
      value: () => '10',
      condition: {
        field: 'enableConnectionPooling',
        value: true,
      },
    },

    // Schema Detection
    {
      id: 'enableSchemaDetection',
      title: 'Enable Schema Detection',
      type: 'switch',
      layout: 'half',
      description: 'Automatically detect table schemas',
      condition: {
        field: 'operation',
        value: ['insert', 'update', 'schema_info'],
      },
    },
    {
      id: 'schemaTable',
      title: 'Schema Table',
      type: 'short-input',
      layout: 'half',
      placeholder: 'table_name for schema detection',
      condition: {
        field: 'enableSchemaDetection',
        value: true,
      },
    },

    // Monitoring and Logging
    {
      id: 'enableQueryLogging',
      title: 'Enable Query Logging',
      type: 'switch',
      layout: 'half',
      description: 'Log executed queries for debugging',
    },
    {
      id: 'enableMetrics',
      title: 'Enable Metrics',
      type: 'switch',
      layout: 'half',
      description: 'Collect execution metrics and performance data',
    },
  ],
  tools: {
    access: ['snowflake_connector'],
    config: {
      tool: (params: Record<string, any>) => 'snowflake_connector',
      params: (params: Record<string, any>) => {
        const baseParams = {
          // Connection
          accountName: params.accountName,
          database: params.database,
          warehouse: params.warehouse,
          schema: params.schema,
          role: params.role,
          connectionMode: params.connectionMode || 'credentials',

          // Authentication
          username: params.username,
          password: params.password,
          oauthToken: params.oauthToken,
          privateKey: params.privateKey,
          privateKeyPassphrase: params.privateKeyPassphrase,

          // Connection Settings
          clientSessionKeepAlive: params.clientSessionKeepAlive || false,
          connectionTimeout: params.connectionTimeout || 60,
          queryTimeout: params.queryTimeout || 300,

          // Operation
          operation: params.operation,
          sqlQuery: params.sqlQuery,
          tableName: params.tableName,

          // Data
          dataMode: params.dataMode,
          insertData: params.insertData,
          updateData: params.updateData,
          whereClause: params.whereClause,

          // Bulk Load
          stageName: params.stageName,
          fileFormat: params.fileFormat,

          // Procedures
          procedureName: params.procedureName,
          procedureParams: params.procedureParams,

          // Query Options
          useParameterizedQuery: params.useParameterizedQuery || false,
          parameters: params.parameters,

          // Output Options
          outputFormat: params.outputFormat || 'json',
          enablePagination: params.enablePagination || false,
          pageSize: params.pageSize || 1000,
          pageNumber: params.pageNumber || 1,

          // Advanced Options
          enableRetry: params.enableRetry || false,
          maxRetries: params.maxRetries || 3,
          retryDelay: params.retryDelay || 1000,
          enableConnectionPooling: params.enableConnectionPooling || false,
          maxConnections: params.maxConnections || 10,

          // Schema Detection
          enableSchemaDetection: params.enableSchemaDetection || false,
          schemaTable: params.schemaTable,

          // Monitoring
          enableQueryLogging: params.enableQueryLogging || false,
          enableMetrics: params.enableMetrics || false,
        }

        return baseParams
      },
    },
  },
  inputs: {
    // Connection inputs
    accountName: { type: 'string', description: 'Snowflake account name' },
    database: { type: 'string', description: 'Database name' },
    warehouse: { type: 'string', description: 'Virtual warehouse name' },
    schema: { type: 'string', description: 'Schema name' },
    username: { type: 'string', description: 'Username for authentication' },
    password: { type: 'string', description: 'Password for authentication' },
    role: { type: 'string', description: 'Security role to assume' },
    connectionMode: { type: 'string', description: 'Authentication method' },
    oauthToken: { type: 'string', description: 'OAuth token for authentication' },
    privateKey: { type: 'string', description: 'Private key for key pair authentication' },
    privateKeyPassphrase: { type: 'string', description: 'Private key passphrase' },
    clientSessionKeepAlive: { type: 'boolean', description: 'Keep session alive' },
    connectionTimeout: { type: 'number', description: 'Connection timeout in seconds' },
    queryTimeout: { type: 'number', description: 'Query timeout in seconds' },

    // Operation inputs
    operation: { type: 'string', description: 'Operation to perform' },
    sqlQuery: { type: 'string', description: 'SQL query to execute' },
    tableName: { type: 'string', description: 'Target table name' },
    dataMode: { type: 'string', description: 'Data input format' },
    insertData: { type: 'json', description: 'Data to insert' },
    updateData: { type: 'json', description: 'Data to update' },
    whereClause: { type: 'string', description: 'WHERE clause for update/delete' },
    stageName: { type: 'string', description: 'Stage name for bulk operations' },
    fileFormat: { type: 'string', description: 'File format for bulk load' },
    procedureName: { type: 'string', description: 'Stored procedure name' },
    procedureParams: { type: 'json', description: 'Procedure parameters' },

    // Query options
    useParameterizedQuery: { type: 'boolean', description: 'Use parameterized queries' },
    parameters: { type: 'json', description: 'Query parameters' },
    outputFormat: { type: 'string', description: 'Output format' },
    enablePagination: { type: 'boolean', description: 'Enable result pagination' },
    pageSize: { type: 'number', description: 'Number of rows per page' },
    pageNumber: { type: 'number', description: 'Page number to retrieve' },

    // Advanced options
    enableRetry: { type: 'boolean', description: 'Enable retry on failure' },
    maxRetries: { type: 'number', description: 'Maximum number of retries' },
    retryDelay: { type: 'number', description: 'Delay between retries in milliseconds' },
    enableConnectionPooling: { type: 'boolean', description: 'Enable connection pooling' },
    maxConnections: { type: 'number', description: 'Maximum number of pooled connections' },
    enableSchemaDetection: { type: 'boolean', description: 'Enable automatic schema detection' },
    schemaTable: { type: 'string', description: 'Table for schema detection' },
    enableQueryLogging: { type: 'boolean', description: 'Enable query logging' },
    enableMetrics: { type: 'boolean', description: 'Enable performance metrics' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the operation was successful' },
    data: { type: 'json', description: 'Query results or operation data' },
    rowCount: { type: 'number', description: 'Number of affected/returned rows' },
    executionTime: { type: 'number', description: 'Query execution time in milliseconds' },
    queryId: { type: 'string', description: 'Snowflake query ID for tracking' },
    error: { type: 'string', description: 'Error message if operation failed' },

    // Schema information
    schema: { type: 'json', description: 'Table schema information' },
    tables: { type: 'json', description: 'List of tables in the database' },
    columns: { type: 'json', description: 'Column information for the table' },

    // Pagination
    hasNextPage: { type: 'boolean', description: 'Whether there are more pages available' },
    totalPages: { type: 'number', description: 'Total number of pages' },
    currentPage: { type: 'number', description: 'Current page number' },

    // Connection info
    connectionInfo: { type: 'json', description: 'Connection status and details' },
    warehouseInfo: { type: 'json', description: 'Warehouse utilization information' },

    // Metrics
    metrics: { type: 'json', description: 'Performance metrics and statistics' },
    queryLog: { type: 'json', description: 'Query execution log' },

    // Bulk operations
    loadStatus: { type: 'json', description: 'Bulk load operation status' },
  },
}
