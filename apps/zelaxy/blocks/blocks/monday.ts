import { MondayIcon } from '@/components/icons/monday-icon'
import type { BlockConfig } from '@/blocks/types'
import type { MondayResponse } from '@/tools/monday/types'

export const MondayBlock: BlockConfig<MondayResponse> = {
  type: 'monday',
  name: 'Monday',
  description: 'Manage boards and items in Monday.com',
  longDescription:
    'List boards, get board items, create items, and update item column values through the Monday.com GraphQL API. Authenticate with a Monday.com API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF3D57',
  icon: MondayIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List boards', id: 'monday_list_boards' },
        { label: 'Get board items', id: 'monday_get_board_items' },
        { label: 'Create item', id: 'monday_create_item' },
        { label: 'Update item', id: 'monday_update_item' },
      ],
      value: () => 'monday_list_boards',
    },
    // Board operations
    {
      id: 'boardId',
      title: 'Board ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '1234567890',
      condition: { field: 'operation', value: ['monday_get_board_items', 'monday_create_item'] },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: ['monday_list_boards', 'monday_get_board_items'] },
    },
    // Create item
    {
      id: 'itemName',
      title: 'Item Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'New item',
      condition: { field: 'operation', value: 'monday_create_item' },
    },
    // Update item
    {
      id: 'itemId',
      title: 'Item ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '9876543210',
      condition: { field: 'operation', value: 'monday_update_item' },
    },
    {
      id: 'columnId',
      title: 'Column ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'status',
      condition: { field: 'operation', value: 'monday_update_item' },
    },
    {
      id: 'value',
      title: 'Value',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Done',
      condition: { field: 'operation', value: 'monday_update_item' },
    },
    {
      id: 'apiKey',
      title: 'Monday API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Monday.com API token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'monday_list_boards',
      'monday_get_board_items',
      'monday_create_item',
      'monday_update_item',
    ],
    config: {
      tool: (params) => params.operation || 'monday_list_boards',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Monday.com API token' },
    boardId: { type: 'string', description: 'Board ID' },
    limit: { type: 'number', description: 'Result limit' },
    itemName: { type: 'string', description: 'Item name' },
    itemId: { type: 'string', description: 'Item ID' },
    columnId: { type: 'string', description: 'Column ID' },
    value: { type: 'string', description: 'Column value' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Monday.com' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
