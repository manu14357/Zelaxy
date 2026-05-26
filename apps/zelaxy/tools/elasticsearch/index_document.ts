import type { ToolConfig } from '@/tools/types'

export const elasticsearchIndexTool: ToolConfig = {
  id: 'elasticsearch_index',
  name: 'Elasticsearch Index Document',
  description: 'Index (create or replace) a document in Elasticsearch.',
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
      required: false,
      visibility: 'user-or-llm',
      description: 'Document ID (auto-generated if not provided)',
    },
    document: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Document to index as JSON',
    },
  },

  request: {
    url: (params) =>
      params.documentId
        ? `${params.url}/${params.index}/_doc/${params.documentId}`
        : `${params.url}/${params.index}/_doc`,
    method: (params) => (params.documentId ? 'PUT' : 'POST'),
    headers: (params) => ({
      'Content-Type': 'application/json',
      ...(params.apiKey ? { Authorization: `ApiKey ${params.apiKey}` } : {}),
    }),
    body: (params) => JSON.parse(params.document),
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
    result: { type: 'string', description: 'Result (created or updated)' },
  },
}
