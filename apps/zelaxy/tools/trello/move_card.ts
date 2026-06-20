import type { TrelloMoveCardParams, TrelloObjectResponse } from '@/tools/trello/types'
import type { ToolConfig } from '@/tools/types'

export const moveCardTool: ToolConfig<TrelloMoveCardParams, TrelloObjectResponse> = {
  id: 'trello_move_card',
  name: 'Trello Move Card',
  description: 'Move a Trello card to a different list',
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
    cardId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the card to move',
    },
    idList: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the destination list',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://api.trello.com/1/cards/${params.cardId}`)
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('token', params.token)
      url.searchParams.append('idList', params.idList)
      return url.toString()
    },
    method: 'PUT',
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
    data: { type: 'json', description: 'The updated Trello card object' },
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
