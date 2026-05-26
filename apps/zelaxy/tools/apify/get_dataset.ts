import type { ApifyGetDatasetParams, ApifyGetDatasetResult } from '@/tools/apify/types'
import type { ToolConfig } from '@/tools/types'

export const apifyGetDatasetTool: ToolConfig<ApifyGetDatasetParams, ApifyGetDatasetResult> = {
  id: 'apify_get_dataset',
  name: 'APIFY Get Dataset',
  description: 'Fetch items from an APIFY dataset',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'APIFY API token',
    },
    datasetId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The dataset ID to fetch items from',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return (default: 100)',
    },
    offset: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of items to skip (for pagination)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://api.apify.com/v2/datasets/${params.datasetId}/items`)
      if (params.limit) url.searchParams.set('limit', params.limit.toString())
      if (params.offset) url.searchParams.set('offset', params.offset.toString())
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
    }),
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`APIFY API error: ${errorText}`)
    }
    const items = await response.json()
    return {
      success: true,
      output: {
        items: Array.isArray(items) ? items : [],
        count: Array.isArray(items) ? items.length : 0,
        total: Array.isArray(items) ? items.length : 0,
        offset: 0,
        limit: 100,
      },
    }
  },

  outputs: {
    items: { type: 'array', description: 'Dataset items' },
    count: { type: 'number', description: 'Number of items returned' },
    total: { type: 'number', description: 'Total number of items in dataset' },
    offset: { type: 'number', description: 'Offset used' },
    limit: { type: 'number', description: 'Limit used' },
  },
}
