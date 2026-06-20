import type { ListDevicesParams, TailscaleListResponse } from '@/tools/tailscale/types'
import type { ToolConfig } from '@/tools/types'

export const listDevicesTool: ToolConfig<ListDevicesParams, TailscaleListResponse> = {
  id: 'tailscale_list_devices',
  name: 'Tailscale List Devices',
  description: 'List all devices in a Tailscale tailnet',
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
      `https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(params.tailnet || '-')}/devices`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const devices = data.devices || []
    return {
      success: true,
      output: { data: devices, metadata: { count: devices.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Tailscale device objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of devices returned' },
      },
    },
  },
}
