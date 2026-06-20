import type { TrelloCreateBoardParams, TrelloObjectResponse } from '@/tools/trello/types'
import type { ToolConfig } from '@/tools/types'

export const createBoardTool: ToolConfig<TrelloCreateBoardParams, TrelloObjectResponse> = {
  id: 'trello_create_board',
  name: 'Trello Create Board',
  description: 'Create a new Trello board',
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
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the new board',
    },
    desc: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Description of the board',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.trello.com/1/boards')
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('token', params.token)
      url.searchParams.append('name', params.name)
      if (params.desc) url.searchParams.append('desc', params.desc)
      return url.toString()
    },
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
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
    data: { type: 'json', description: 'The created Trello board object' },
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
