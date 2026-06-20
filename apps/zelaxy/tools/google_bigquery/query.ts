import type {
  GoogleBigQueryObjectResponse,
  GoogleBigQueryQueryParams,
} from '@/tools/google_bigquery/types'
import type { ToolConfig } from '@/tools/types'

export const queryTool: ToolConfig<GoogleBigQueryQueryParams, GoogleBigQueryObjectResponse> = {
  id: 'google_bigquery_query',
  name: 'BigQuery Run Query',
  description: 'Run a SQL query against Google BigQuery and return the results',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for Google BigQuery',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Google Cloud project ID',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'SQL query to execute',
    },
  },

  request: {
    url: (params) =>
      `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(params.projectId)}/queries`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: params.query,
      useLegacySql: false,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to execute BigQuery query')
    }
    return {
      success: true,
      output: {
        data,
        metadata: { jobComplete: data.jobComplete, totalRows: data.totalRows },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The BigQuery query result object' },
    metadata: {
      type: 'json',
      description: 'Query metadata',
      properties: {
        jobComplete: { type: 'boolean', description: 'Whether the query completed' },
        totalRows: { type: 'string', description: 'Total number of rows in the result set' },
      },
    },
  },
}
