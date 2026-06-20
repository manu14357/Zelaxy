import type { TinybirdQueryParams, TinybirdResponse } from '@/tools/tinybird/types'
import type { ToolConfig } from '@/tools/types'

export const queryTool: ToolConfig<TinybirdQueryParams, TinybirdResponse> = {
  id: 'tinybird_query',
  name: 'Tinybird Query',
  description: 'Run a SQL query against Tinybird and return JSON results',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Tinybird API token',
    },
    sql: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The SQL query to execute',
    },
  },

  request: {
    url: (params) => `https://api.tinybird.co/v0/sql?q=${encodeURIComponent(params.sql)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { count: (data.data || []).length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Tinybird result object ({ meta, data, rows })' },
    metadata: {
      type: 'json',
      description: 'Query metadata',
      properties: {
        count: { type: 'number', description: 'Number of rows returned' },
      },
    },
  },
}
