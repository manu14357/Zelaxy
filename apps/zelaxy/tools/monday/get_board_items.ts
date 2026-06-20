import type { MondayGetBoardItemsParams, MondayResponse } from '@/tools/monday/types'
import type { ToolConfig } from '@/tools/types'

export const getBoardItemsTool: ToolConfig<MondayGetBoardItemsParams, MondayResponse> = {
  id: 'monday_get_board_items',
  name: 'Monday Get Board Items',
  description: 'Get items from a Monday.com board',
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
      description: 'ID of the board to get items from',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items to return',
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
    body: (params) => {
      const limit = params.limit ? Number(params.limit) : 25
      return {
        query: `{ boards(ids: [${params.boardId}]) { items_page(limit: ${limit}) { items { id name column_values { id text value } } } } }`,
      }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const boards = data.data?.boards || []
    const items = boards[0]?.items_page?.items || []
    return {
      success: true,
      output: { data: items, metadata: { count: items.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Monday.com item objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
