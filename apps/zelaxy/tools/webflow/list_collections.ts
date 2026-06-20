import type { ToolConfig } from '@/tools/types'
import type { ListCollectionsParams, WebflowListResponse } from '@/tools/webflow/types'

export const listCollectionsTool: ToolConfig<ListCollectionsParams, WebflowListResponse> = {
  id: 'webflow_list_collections',
  name: 'Webflow List Collections',
  description: 'List all CMS collections for a Webflow site',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Webflow API token',
    },
    site_id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the Webflow site',
    },
  },

  request: {
    url: (params) => `https://api.webflow.com/v2/sites/${params.site_id}/collections`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const collections = data.collections || []
    return {
      success: true,
      output: {
        data: collections,
        metadata: { count: collections.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Webflow collection objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
