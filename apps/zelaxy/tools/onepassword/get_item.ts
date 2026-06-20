import type { GetItemParams, OnePasswordObjectResponse } from '@/tools/onepassword/types'
import type { ToolConfig } from '@/tools/types'

export const getItemTool: ToolConfig<GetItemParams, OnePasswordObjectResponse> = {
  id: 'onepassword_get_item',
  name: '1Password Get Item',
  description: 'Get the full details of a single item from a 1Password vault',
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
      description: 'ID of the vault containing the item',
    },
    itemId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the item to retrieve',
    },
  },

  request: {
    url: (params) =>
      `${params.connectUrl.replace(/\/$/, '')}/v1/vaults/${encodeURIComponent(params.vaultId)}/items/${encodeURIComponent(params.itemId)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The full 1Password item object' },
    metadata: {
      type: 'json',
      description: 'Item identifiers',
      properties: {
        id: { type: 'string', description: 'Item ID' },
      },
    },
  },
}
