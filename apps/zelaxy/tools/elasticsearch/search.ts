import type { ToolConfig } from '@/tools/types'

export const elasticsearchSearchTool: ToolConfig = {
  id: 'elasticsearch_search',
  name: 'Elasticsearch Search',
  description: 'Search documents in an Elasticsearch index.',
  version: '1.0.0',

  params: {
    url: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Elasticsearch base URL (e.g., https://my-cluster.es.io:9200)',
    },
    apiKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Elasticsearch API key for authentication',
    },
    index: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the index to search',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Elasticsearch query as JSON (e.g., {"match": {"title": "hello"}})',
    },
    size: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of results to return (default: 10)',
    },
  },

  request: {
    url: (params) => `${params.url}/${params.index}/_search`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      ...(params.apiKey ? { Authorization: `ApiKey ${params.apiKey}` } : {}),
    }),
    body: (params) => ({
      query: JSON.parse(params.query),
      size: Number(params.size) || 10,
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
      output: {
        hits: data.hits?.hits ?? [],
        total: data.hits?.total?.value ?? data.hits?.total ?? 0,
        took: data.took ?? 0,
      },
    }
  },

  outputs: {
    hits: { type: 'json', description: 'Array of matching documents' },
    total: { type: 'number', description: 'Total number of matching documents' },
    took: { type: 'number', description: 'Time in milliseconds for the search' },
  },
}
