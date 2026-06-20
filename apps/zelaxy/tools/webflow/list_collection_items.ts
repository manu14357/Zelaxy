import type { ToolConfig } from '@/tools/types'
import type { ListCollectionItemsParams, WebflowListResponse } from '@/tools/webflow/types'

export const listCollectionItemsTool: ToolConfig<ListCollectionItemsParams, WebflowListResponse> = {
  id: 'webflow_list_collection_items',
  name: 'Webflow List Collection Items',
  description: 'List all items in a Webflow CMS collection',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Webflow API token',
    },
    collection_id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the Webflow CMS collection',
    },
  },

  request: {
    url: (params) => `https://api.webflow.com/v2/collections/${params.collection_id}/items`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Webflow collection item objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
