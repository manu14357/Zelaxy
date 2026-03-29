import type { ToolConfig } from '@/tools/types'
import type { MSSQLQueryParams, MSSQLResponse } from './types'
// Note: Tool implementation now handled by API route at /api/tools/mssql

export const mssqlTool: ToolConfig<MSSQLQueryParams, MSSQLResponse> = {
  id: 'mssql_database',
  name: 'Microsoft SQL Server',
  description: 'Execute SQL queries and manage files in Microsoft SQL Server database',
  version: '1.0.0',

  params: {
    server: {
      type: 'string',
      required: true,
      description: 'SQL Server hostname or IP address',
    },
    database: {
      type: 'string',
      required: true,
      description: 'Database name',
    },
    username: {
      type: 'string',
      required: true,
      description: 'Database username',
    },
    password: {
      type: 'string',
      required: true,
      description: 'Database password',
    },
    port: {
      type: 'number',
      required: false,
      default: 1433,
      description: 'SQL Server port (default: 1433)',
    },
    encrypt: {
      type: 'boolean',
      required: false,
      default: true,
      description: 'Enable SSL encryption',
    },
    trustServerCertificate: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Trust server certificate',
    },
    action: {
      type: 'string',
      required: true,
      description:
        'Action to perform: execute, insert, update, delete, create_file, delete_file, edit_file, get_file, list_files',
    },
    query: {
      type: 'string',
      required: false,
      description: 'SQL query to execute (for execute action)',
    },
    table: {
      type: 'string',
      required: false,
      description: 'Table name (for insert, update, delete actions)',
    },
    data: {
      type: 'object',
      required: false,
      description: 'Data to insert/update (object or array of objects)',
    },
    conditions: {
      type: 'object',
      required: false,
      description: 'Conditions for update/delete operations',
    },
    filePath: {
      type: 'string',
      required: false,
      description: 'File path for file operations',
    },
    content: {
      type: 'string',
      required: false,
      description: 'File content for create/edit operations',
    },
    folderPath: {
      type: 'string',
      required: false,
      description: 'Folder path for list operations',
    },
  },

  outputs: {
    success: {
      type: 'boolean',
      description: 'Whether the operation was successful',
    },
    data: {
      type: 'array',
      description: 'Query results (for SELECT queries)',
      optional: true,
    },
    affectedRows: {
      type: 'number',
      description: 'Number of rows affected (for INSERT/UPDATE/DELETE)',
      optional: true,
    },
    error: {
      type: 'string',
      description: 'Error message if operation failed',
      optional: true,
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata about the query execution',
      optional: true,
    },
    fileName: {
      type: 'string',
      description: 'File name for file operations',
      optional: true,
    },
    filePath: {
      type: 'string',
      description: 'Full file path',
      optional: true,
    },
    content: {
      type: 'string',
      description: 'File content',
      optional: true,
    },
    files: {
      type: 'array',
      description: 'List of files (for list operations)',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/mssql',
    method: 'POST',
    headers: (params: MSSQLQueryParams) => ({
      'Content-Type': 'application/json',
    }),
    body: (params: MSSQLQueryParams) => ({
      ...params,
    }),
  },

  transformResponse: async (
    response: Response,
    params?: MSSQLQueryParams
  ): Promise<MSSQLResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: {},
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const result = await response.json()
      return result as MSSQLResponse
    } catch (error) {
      return {
        success: false,
        output: {},
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
}
