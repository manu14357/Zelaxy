import type { MondayResponse, MondayUpdateItemParams } from '@/tools/monday/types'
import type { ToolConfig } from '@/tools/types'

export const updateItemTool: ToolConfig<MondayUpdateItemParams, MondayResponse> = {
  id: 'monday_update_item',
  name: 'Monday Update Item',
  description: 'Update a single column value of an item on a Monday.com board',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Monday.com API token',
    },
    itemId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the item to update',
    },
    columnId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the column to update',
    },
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'New simple value for the column',
    },
  },

  request: {
    url: () => 'https://api.monday.com/v2',
    method: 'POST',
    headers: (params) => ({
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
      'API-Version': '2024-01',
    }),
    body: (params) => ({
      query: `mutation { change_simple_column_value(item_id: ${params.itemId}, column_id: ${JSON.stringify(params.columnId)}, value: ${JSON.stringify(params.value)}) { id name } }`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const item = data.data?.change_simple_column_value || {}
    return {
      success: true,
      output: { data: item, metadata: { id: item.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The updated Monday.com item object' },
    metadata: {
      type: 'json',
      description: 'Item identifiers',
      properties: {
        id: { type: 'string', description: 'Item ID' },
      },
    },
  },
}
