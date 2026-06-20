import type { GetDeviceParams, TailscaleObjectResponse } from '@/tools/tailscale/types'
import type { ToolConfig } from '@/tools/types'

export const getDeviceTool: ToolConfig<GetDeviceParams, TailscaleObjectResponse> = {
  id: 'tailscale_get_device',
  name: 'Tailscale Get Device',
  description: 'Get details for a single Tailscale device by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Tailscale API access token',
    },
    deviceId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the device to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://api.tailscale.com/api/v2/device/${encodeURIComponent(params.deviceId)}`,
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
    data: { type: 'json', description: 'The Tailscale device object' },
    metadata: {
      type: 'json',
      description: 'Device identifiers',
      properties: {
        id: { type: 'string', description: 'Device ID' },
      },
    },
  },
}
