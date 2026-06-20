import type { MondayListBoardsParams, MondayResponse } from '@/tools/monday/types'
import type { ToolConfig } from '@/tools/types'

export const listBoardsTool: ToolConfig<MondayListBoardsParams, MondayResponse> = {
  id: 'monday_list_boards',
  name: 'Monday List Boards',
  description: 'List boards from your Monday.com account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Monday.com API token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of boards to return',
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
        query: `{ boards(limit: ${limit}) { id name } }`,
      }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const boards = data.data?.boards || []
    return {
      success: true,
      output: { data: boards, metadata: { count: boards.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Monday.com board objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of boards returned' },
      },
    },
  },
}
