import { TrelloIcon } from '@/components/icons/trello-icon'
import type { BlockConfig } from '@/blocks/types'
import type { TrelloResponse } from '@/tools/trello/types'

export const TrelloBlock: BlockConfig<TrelloResponse> = {
  type: 'trello',
  name: 'Trello',
  description: 'Manage boards and cards in Trello',
  longDescription:
    'Create cards, list cards, get and create boards, and move cards across lists through the Trello REST API. Authenticate with a Trello API key and token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0079BF',
  icon: TrelloIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create card', id: 'trello_create_card' },
        { label: 'List cards', id: 'trello_list_cards' },
        { label: 'Get board', id: 'trello_get_board' },
        { label: 'Create board', id: 'trello_create_board' },
        { label: 'Move card', id: 'trello_move_card' },
      ],
      value: () => 'trello_create_card',
    },
    // Create card
    {
      id: 'idList',
      title: 'List ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '5abbe4b7ddc1b351ef961414',
      condition: { field: 'operation', value: ['trello_create_card', 'trello_move_card'] },
    },
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'My card',
      condition: { field: 'operation', value: ['trello_create_card', 'trello_create_board'] },
    },
    {
      id: 'desc',
      title: 'Description',
      type: 'long-input',
      layout: 'full',
      condition: { field: 'operation', value: ['trello_create_card', 'trello_create_board'] },
    },
    // Board operations
    {
      id: 'boardId',
      title: 'Board ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '5abbe4b7ddc1b351ef961414',
      condition: { field: 'operation', value: ['trello_list_cards', 'trello_get_board'] },
    },
    // Move card
    {
      id: 'cardId',
      title: 'Card ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '5abbe4b7ddc1b351ef961414',
      condition: { field: 'operation', value: 'trello_move_card' },
    },
    {
      id: 'apiKey',
      title: 'Trello API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Trello API key',
      password: true,
      required: true,
    },
    {
      id: 'token',
      title: 'Trello API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Trello API token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'trello_create_card',
      'trello_list_cards',
      'trello_get_board',
      'trello_create_board',
      'trello_move_card',
    ],
    config: {
      tool: (params) => params.operation || 'trello_create_card',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Trello API key' },
    token: { type: 'string', description: 'Trello API token' },
    idList: { type: 'string', description: 'List ID' },
    name: { type: 'string', description: 'Card or board name' },
    desc: { type: 'string', description: 'Description' },
    boardId: { type: 'string', description: 'Board ID' },
    cardId: { type: 'string', description: 'Card ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Trello' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
