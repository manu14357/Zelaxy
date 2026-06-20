import type {
  GoogleBigQueryListResponse,
  GoogleBigQueryListTablesParams,
} from '@/tools/google_bigquery/types'
import type { ToolConfig } from '@/tools/types'

export const listTablesTool: ToolConfig<
  GoogleBigQueryListTablesParams,
  GoogleBigQueryListResponse
> = {
  id: 'google_bigquery_list_tables',
  name: 'BigQuery List Tables',
  description: 'List all tables in a Google BigQuery dataset',
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
    datasetId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'BigQuery dataset ID',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of tables to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(params.projectId)}/datasets/${encodeURIComponent(params.datasetId)}/tables`
      )
      if (params.maxResults) url.searchParams.set('maxResults', String(params.maxResults))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to list BigQuery tables')
    }
    const tables = data.tables || []
    return {
      success: true,
      output: {
        data: tables,
        metadata: { count: tables.length, nextPageToken: data.nextPageToken },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of BigQuery table objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of tables returned' },
        nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
      },
    },
  },
}
