import type { ToolConfig } from '@/tools/types'

export const elasticsearchListIndicesTool: ToolConfig = {
  id: 'elasticsearch_list_indices',
  name: 'Elasticsearch List Indices',
  description: 'List all indices in an Elasticsearch cluster.',
  version: '1.0.0',

  params: {
    url: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Elasticsearch base URL',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Elasticsearch API key for authentication',
    },
  },

  request: {
    url: (params) => `${params.url}/_cat/indices?format=json`,
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      ...(params.apiKey ? { Authorization: `ApiKey ${params.apiKey}` } : {}),
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        (data as { error?: { reason?: string } }).error?.reason || `HTTP ${response.status}`
      )
    }
    return {
      success: true,
      output: { indices: Array.isArray(data) ? data : [] },
    }
  },

  outputs: {
    indices: { type: 'json', description: 'Array of index metadata objects' },
  },
}
