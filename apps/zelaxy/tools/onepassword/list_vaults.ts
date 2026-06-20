import type { ListVaultsParams, OnePasswordListResponse } from '@/tools/onepassword/types'
import type { ToolConfig } from '@/tools/types'

export const listVaultsTool: ToolConfig<ListVaultsParams, OnePasswordListResponse> = {
  id: 'onepassword_list_vaults',
  name: '1Password List Vaults',
  description: 'List the vaults available on a 1Password Connect server',
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
  },

  request: {
    url: (params) => `${params.connectUrl.replace(/\/$/, '')}/v1/vaults`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const vaults = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: vaults, metadata: { count: vaults.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of 1Password vault objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of vaults returned' },
      },
    },
  },
}
