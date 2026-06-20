import type { ClickhouseQueryParams, ClickhouseQueryResponse } from '@/tools/clickhouse/types'
import type { ToolConfig } from '@/tools/types'

export const queryTool: ToolConfig<ClickhouseQueryParams, ClickhouseQueryResponse> = {
  id: 'clickhouse_query',
  name: 'ClickHouse Query',
  description: 'Run a SQL query against a ClickHouse instance and return JSON results',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description:
        'Full base URL of the ClickHouse instance, e.g. https://xxx.clickhouse.cloud:8443',
    },
    username: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ClickHouse username',
    },
    password: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ClickHouse password',
    },
    sql: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The SQL query to execute',
    },
  },

  request: {
    url: (params) => `${params.host}/?query=${encodeURIComponent(`${params.sql} FORMAT JSON`)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.username}:${params.password}`).toString('base64')}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { rows: data.rows ?? (data.data || []).length, statistics: data.statistics },
      },
    }
  },

  outputs: {
    data: {
      type: 'json',
      description: 'The ClickHouse result object ({ data, rows, statistics })',
    },
    metadata: {
      type: 'json',
      description: 'Query metadata',
      properties: {
        rows: { type: 'number', description: 'Number of rows returned' },
        statistics: { type: 'json', description: 'ClickHouse query statistics' },
      },
    },
  },
}
