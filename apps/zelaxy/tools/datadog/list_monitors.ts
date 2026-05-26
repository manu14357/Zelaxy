import type { ToolConfig } from '@/tools/types'

export const datadogListMonitorsTool: ToolConfig = {
  id: 'datadog_list_monitors',
  name: 'Datadog List Monitors',
  description: 'List all monitors in a Datadog account.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Datadog API key',
    },
    appKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Datadog Application key',
    },
    site: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Datadog site (default: datadoghq.com)',
    },
  },

  request: {
    url: (params) => {
      const site = params.site || 'datadoghq.com'
      return `https://api.${site}/api/v1/monitor`
    },
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'DD-API-KEY': params.apiKey,
      'DD-APPLICATION-KEY': params.appKey,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error((data as { errors?: string[] }).errors?.[0] || `HTTP ${response.status}`)
    }
    return {
      success: true,
      output: {
        monitors: Array.isArray(data) ? data : [],
      },
    }
  },

  outputs: {
    monitors: { type: 'json', description: 'Array of monitors' },
  },
}
