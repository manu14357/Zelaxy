import type { ToolConfig } from '@/tools/types'

export const elasticsearchDeleteTool: ToolConfig = {
  id: 'elasticsearch_delete',
  name: 'Elasticsearch Delete Document',
  description: 'Delete a document from Elasticsearch by its ID.',
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
      description: 'Document ID to delete',
    },
  },

  request: {
    url: (params) => `${params.url}/${params.index}/_doc/${params.documentId}`,
    method: 'DELETE',
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
        result: data.result ?? '',
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Document ID' },
    index: { type: 'string', description: 'Index name' },
    result: { type: 'string', description: 'Result (deleted)' },
  },
}
