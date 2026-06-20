import type { ToolConfig } from '@/tools/types'
import type { CreateCollectionItemParams, WebflowObjectResponse } from '@/tools/webflow/types'

export const createCollectionItemTool: ToolConfig<
  CreateCollectionItemParams,
  WebflowObjectResponse
> = {
  id: 'webflow_create_collection_item',
  name: 'Webflow Create Collection Item',
  description: 'Create a new item in a Webflow CMS collection',
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
    fieldData: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Field data for the new item. Keys should match collection field slugs',
    },
  },

  request: {
    url: (params) => `https://api.webflow.com/v2/collections/${params.collection_id}/items`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      fieldData: params.fieldData,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: String(data.id ?? '') },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Webflow collection item object' },
    metadata: {
      type: 'json',
      description: 'Item identifiers',
      properties: {
        id: { type: 'string', description: 'Item ID' },
      },
    },
  },
}
