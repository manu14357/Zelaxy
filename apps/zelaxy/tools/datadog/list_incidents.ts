import type { ToolConfig } from '@/tools/types'

export const datadogListIncidentsTool: ToolConfig = {
  id: 'datadog_list_incidents',
  name: 'Datadog List Incidents',
  description: 'List all incidents in Datadog.',
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
      return `https://api.${site}/api/v2/incidents`
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
    const d = data as Record<string, unknown>
    const meta = d.meta as Record<string, unknown> | undefined
    const pagination = meta?.pagination as Record<string, unknown> | undefined
    return {
      success: true,
      output: {
        incidents: d.data ?? [],
        cursor: pagination?.next_offset ?? null,
      },
    }
  },

  outputs: {
    incidents: { type: 'json', description: 'Array of incidents' },
    cursor: { type: 'string', description: 'Pagination cursor', optional: true },
  },
}
