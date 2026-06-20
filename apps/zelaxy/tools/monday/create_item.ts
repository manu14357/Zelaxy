import type { MondayCreateItemParams, MondayResponse } from '@/tools/monday/types'
import type { ToolConfig } from '@/tools/types'

export const createItemTool: ToolConfig<MondayCreateItemParams, MondayResponse> = {
  id: 'monday_create_item',
  name: 'Monday Create Item',
  description: 'Create a new item on a Monday.com board',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Monday.com API token',
    },
    boardId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the board to create the item on',
    },
    itemName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the new item',
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
      query: `mutation { create_item(board_id: ${params.boardId}, item_name: ${JSON.stringify(params.itemName)}) { id name } }`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const item = data.data?.create_item || {}
    return {
      success: true,
      output: { data: item, metadata: { id: item.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Monday.com item object' },
    metadata: {
      type: 'json',
      description: 'Item identifiers',
      properties: {
        id: { type: 'string', description: 'Item ID' },
      },
    },
  },
}
