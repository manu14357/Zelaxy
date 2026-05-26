import type { ToolConfig } from '@/tools/types'
import { databricksHeaders, databricksHost, parseDatabricksResponse } from './utils'

export const databricksExecuteSqlTool: ToolConfig = {
  id: 'databricks_execute_sql',
  name: 'Databricks Execute SQL',
  description: 'Execute a SQL statement against a Databricks SQL warehouse and return results.',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Databricks workspace URL (e.g., https://your-workspace.azuredatabricks.net)',
    },
    token: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Databricks Personal Access Token',
    },
    warehouseId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the SQL warehouse to execute against',
    },
    statement: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The SQL statement to execute',
    },
  },

  request: {
    url: (params) => `https://${databricksHost(params.host)}/api/2.0/sql/statements/`,
    method: 'POST',
    headers: databricksHeaders,
    body: (params) => ({
      warehouse_id: params.warehouseId,
      statement: params.statement,
      format: 'JSON_ARRAY',
      disposition: 'INLINE',
      wait_timeout: '50s',
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDatabricksResponse(response)
    const status = data.status?.state ?? 'UNKNOWN'
    if (status === 'FAILED') {
      throw new Error(data.status?.error?.message || 'SQL execution failed')
    }
    const columns =
      data.manifest?.schema?.columns?.map(
        (col: { name: string; position: number; type_name: string }) => ({
          name: col.name ?? '',
          position: col.position ?? 0,
          typeName: col.type_name ?? '',
        })
      ) ?? null
    return {
      success: true,
      output: {
        statementId: data.statement_id ?? '',
        status,
        columns,
        rows: data.result?.data_array ?? null,
        totalRows: data.manifest?.total_row_count ?? null,
      },
    }
  },

  outputs: {
    statementId: { type: 'string', description: 'Statement ID' },
    status: { type: 'string', description: 'Execution status (SUCCEEDED, FAILED, etc.)' },
    columns: { type: 'json', description: 'Column schema', optional: true },
    rows: { type: 'json', description: 'Result rows as 2D array', optional: true },
    totalRows: { type: 'number', description: 'Total number of result rows', optional: true },
  },
}
