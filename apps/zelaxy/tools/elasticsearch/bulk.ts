import type { ToolConfig } from '@/tools/types'

export const elasticsearchBulkTool: ToolConfig = {
  id: 'elasticsearch_bulk',
  name: 'Elasticsearch Bulk Operations',
  description:
    'Perform multiple index, delete, or update operations in a single Elasticsearch bulk request.',
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
    body: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'NDJSON body for bulk operations (each line is a JSON object)',
    },
  },

  request: {
    url: (params) => `${params.url}/_bulk`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/x-ndjson',
      ...(params.apiKey ? { Authorization: `ApiKey ${params.apiKey}` } : {}),
    }),
    body: (params) => params.body,
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
        took: data.took ?? 0,
        errors: data.errors ?? false,
        items: data.items ?? [],
      },
    }
  },

  outputs: {
    took: { type: 'number', description: 'Time in milliseconds for the bulk request' },
    errors: { type: 'boolean', description: 'Whether any operations had errors' },
    items: { type: 'json', description: 'Array of operation results' },
  },
}
