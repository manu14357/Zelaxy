import { OnePasswordIcon } from '@/components/icons/onepassword-icon'
import type { BlockConfig } from '@/blocks/types'
import type { OnePasswordResponse } from '@/tools/onepassword/types'

export const OnePasswordBlock: BlockConfig<OnePasswordResponse> = {
  type: 'onepassword',
  name: '1Password',
  description: 'List vaults and items via 1Password Connect',
  longDescription:
    'List vaults, list items, and fetch item details from a 1Password Connect server. Authenticate with a Connect access token and point the block at your Connect server URL.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0364D3',
  icon: OnePasswordIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List vaults', id: 'onepassword_list_vaults' },
        { label: 'List items', id: 'onepassword_list_items' },
        { label: 'Get item', id: 'onepassword_get_item' },
      ],
      value: () => 'onepassword_list_vaults',
    },
    {
      id: 'vaultId',
      title: 'Vault ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Vault ID',
      condition: {
        field: 'operation',
        value: ['onepassword_list_items', 'onepassword_get_item'],
      },
    },
    {
      id: 'itemId',
      title: 'Item ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Item ID',
      condition: { field: 'operation', value: 'onepassword_get_item' },
    },
    {
      id: 'connectUrl',
      title: 'Connect Server URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://connect.example.com',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Connect Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'eyJ...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['onepassword_list_vaults', 'onepassword_list_items', 'onepassword_get_item'],
    config: {
      tool: (params) => params.operation || 'onepassword_list_vaults',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: '1Password Connect access token' },
    connectUrl: { type: 'string', description: '1Password Connect server URL' },
    vaultId: { type: 'string', description: 'Vault ID' },
    itemId: { type: 'string', description: 'Item ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from 1Password' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
