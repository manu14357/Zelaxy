import type { ToolConfig } from '@/tools/types'

export const datadogCreateIncidentTool: ToolConfig = {
  id: 'datadog_create_incident',
  name: 'Datadog Create Incident',
  description: 'Create a new incident in Datadog.',
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
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Title of the incident',
    },
  },

  request: {
    url: (params) => {
      const site = params.site || 'datadoghq.com'
      return `https://api.${site}/api/v2/incidents`
    },
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'DD-API-KEY': params.apiKey,
      'DD-APPLICATION-KEY': params.appKey,
    }),
    body: (params) => ({
      data: {
        type: 'incidents',
        attributes: {
          title: params.title,
          customerImpacted: false,
        },
      },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error((data as { errors?: string[] }).errors?.[0] || `HTTP ${response.status}`)
    }
    const d = data as Record<string, unknown>
    const item = d.data as Record<string, unknown> | undefined
    const attr = item?.attributes as Record<string, unknown> | undefined
    return {
      success: true,
      output: {
        id: item?.id ?? '',
        title: attr?.title ?? '',
        status: attr?.status ?? '',
        created: attr?.created ?? null,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Incident ID' },
    title: { type: 'string', description: 'Incident title' },
    status: { type: 'string', description: 'Incident status' },
    created: { type: 'string', description: 'Creation timestamp', optional: true },
  },
}
