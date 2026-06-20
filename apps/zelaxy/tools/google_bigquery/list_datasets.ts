import type {
  GoogleBigQueryListDatasetsParams,
  GoogleBigQueryListResponse,
} from '@/tools/google_bigquery/types'
import type { ToolConfig } from '@/tools/types'

export const listDatasetsTool: ToolConfig<
  GoogleBigQueryListDatasetsParams,
  GoogleBigQueryListResponse
> = {
  id: 'google_bigquery_list_datasets',
  name: 'BigQuery List Datasets',
  description: 'List all datasets in a Google BigQuery project',
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
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of datasets to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(params.projectId)}/datasets`
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
      throw new Error(data.error?.message || 'Failed to list BigQuery datasets')
    }
    const datasets = data.datasets || []
    return {
      success: true,
      output: {
        data: datasets,
        metadata: { count: datasets.length, nextPageToken: data.nextPageToken },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of BigQuery dataset objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of datasets returned' },
        nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
      },
    },
  },
}
