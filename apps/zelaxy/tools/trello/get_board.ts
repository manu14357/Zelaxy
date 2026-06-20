import type { TrelloGetBoardParams, TrelloObjectResponse } from '@/tools/trello/types'
import type { ToolConfig } from '@/tools/types'

export const getBoardTool: ToolConfig<TrelloGetBoardParams, TrelloObjectResponse> = {
  id: 'trello_get_board',
  name: 'Trello Get Board',
  description: 'Get a Trello board by ID',
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
      description: 'ID of the board to retrieve',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://api.trello.com/1/boards/${params.boardId}`)
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
    return {
      success: true,
      output: { data, metadata: { id: data.id, url: data.url } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Trello board object' },
    metadata: {
      type: 'json',
      description: 'Board identifiers',
      properties: {
        id: { type: 'string', description: 'Board ID' },
        url: { type: 'string', description: 'Full board URL' },
      },
    },
  },
}
