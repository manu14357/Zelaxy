import type { ListItemsParams, OnePasswordListResponse } from '@/tools/onepassword/types'
import type { ToolConfig } from '@/tools/types'

export const listItemsTool: ToolConfig<ListItemsParams, OnePasswordListResponse> = {
  id: 'onepassword_list_items',
  name: '1Password List Items',
  description: 'List the items inside a 1Password vault',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: '1Password Connect access token',
    },
    connectUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: '1Password Connect server URL (e.g. https://connect.example.com)',
    },
    vaultId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the vault to list items from',
    },
  },

  request: {
    url: (params) =>
      `${params.connectUrl.replace(/\/$/, '')}/v1/vaults/${encodeURIComponent(params.vaultId)}/items`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: items, metadata: { count: items.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of 1Password item summary objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
