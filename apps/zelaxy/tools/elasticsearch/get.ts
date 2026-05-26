import type { ToolConfig } from '@/tools/types'

export const elasticsearchGetTool: ToolConfig = {
  id: 'elasticsearch_get',
  name: 'Elasticsearch Get Document',
  description: 'Retrieve a document from Elasticsearch by its ID.',
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
    index: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the index',
    },
    documentId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Document ID to retrieve',
    },
  },

  request: {
    url: (params) => `${params.url}/${params.index}/_doc/${params.documentId}`,
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
      output: {
        id: data._id ?? '',
        index: data._index ?? '',
        source: data._source ?? null,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Document ID' },
    index: { type: 'string', description: 'Index name' },
    source: { type: 'json', description: 'Document source' },
  },
}
