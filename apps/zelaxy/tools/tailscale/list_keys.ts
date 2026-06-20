import type { ListKeysParams, TailscaleListResponse } from '@/tools/tailscale/types'
import type { ToolConfig } from '@/tools/types'

export const listKeysTool: ToolConfig<ListKeysParams, TailscaleListResponse> = {
  id: 'tailscale_list_keys',
  name: 'Tailscale List Keys',
  description: 'List the auth keys and API access tokens for a Tailscale tailnet',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Tailscale API access token',
    },
    tailnet: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Tailnet name (use '-' for the default tailnet)",
    },
  },

  request: {
    url: (params) =>
      `https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(params.tailnet || '-')}/keys`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const keys = data.keys || []
    return {
      success: true,
      output: { data: keys, metadata: { count: keys.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Tailscale key objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of keys returned' },
      },
    },
  },
}
