import type { ToolConfig } from '@/tools/types'
import type { PostgreSQLQueryParams, PostgreSQLResponse } from './types'

export const postgresqlTool: ToolConfig<PostgreSQLQueryParams, PostgreSQLResponse> = {
  id: 'postgresql_database',
  name: 'PostgreSQL',
  description: 'Execute SQL queries and manage data in PostgreSQL databases',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      description: 'PostgreSQL hostname or IP address',
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
      default: 5432,
      description: 'PostgreSQL port (default: 5432)',
    },
    ssl: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable SSL connection',
    },
    action: {
      type: 'string',
      required: true,
      description: 'Action to perform: execute, insert, update, delete',
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
  },

  request: {
    url: '/api/tools/postgresql',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params: PostgreSQLQueryParams) => ({
      ...params,
    }),
  },

  transformResponse: async (
    response: Response,
    _params?: PostgreSQLQueryParams
  ): Promise<PostgreSQLResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: {},
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const result = await response.json()
      return result as PostgreSQLResponse
    } catch (error) {
      return {
        success: false,
        output: {},
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
}
