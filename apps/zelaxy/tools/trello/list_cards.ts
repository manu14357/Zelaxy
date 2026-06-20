import type { TrelloListCardsParams, TrelloListResponse } from '@/tools/trello/types'
import type { ToolConfig } from '@/tools/types'

export const listCardsTool: ToolConfig<TrelloListCardsParams, TrelloListResponse> = {
  id: 'trello_list_cards',
  name: 'Trello List Cards',
  description: 'List cards on a Trello board',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Trello API key',
    },
    token: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Trello API token',
    },
    boardId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the board to list cards from',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://api.trello.com/1/boards/${params.boardId}/cards`)
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('token', params.token)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const cards = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: cards, metadata: { count: cards.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Trello card objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of cards returned' },
      },
    },
  },
}
