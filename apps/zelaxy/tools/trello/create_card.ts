import type { TrelloCreateCardParams, TrelloObjectResponse } from '@/tools/trello/types'
import type { ToolConfig } from '@/tools/types'

export const createCardTool: ToolConfig<TrelloCreateCardParams, TrelloObjectResponse> = {
  id: 'trello_create_card',
  name: 'Trello Create Card',
  description: 'Create a new card in a Trello list',
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
    idList: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the list to add the card to',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name/title of the card',
    },
    desc: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Description of the card',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.trello.com/1/cards')
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('token', params.token)
      url.searchParams.append('idList', params.idList)
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
    data: { type: 'json', description: 'The created Trello card object' },
    metadata: {
      type: 'json',
      description: 'Card identifiers',
      properties: {
        id: { type: 'string', description: 'Card ID' },
        url: { type: 'string', description: 'Full card URL' },
      },
    },
  },
}
