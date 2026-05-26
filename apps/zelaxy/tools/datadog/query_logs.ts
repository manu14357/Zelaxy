import type { ToolConfig } from '@/tools/types'

export const datadogQueryLogsTool: ToolConfig = {
  id: 'datadog_query_logs',
  name: 'Datadog Query Logs',
  description: 'Search Datadog logs for a given time range.',
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
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Log search query (e.g., service:myapp status:error)',
    },
    from: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start of time range (Unix epoch seconds)',
    },
    to: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'End of time range (Unix epoch seconds)',
    },
  },

  request: {
    url: (params) => {
      const site = params.site || 'datadoghq.com'
      return `https://api.${site}/api/v2/logs/events/search`
    },
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'DD-API-KEY': params.apiKey,
      'DD-APPLICATION-KEY': params.appKey,
    }),
    body: (params) => ({
      filter: {
        query: params.query,
        from: new Date(Number(params.from) * 1000).toISOString(),
        to: new Date(Number(params.to) * 1000).toISOString(),
      },
      page: { limit: 50 },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error((data as { errors?: string[] }).errors?.[0] || `HTTP ${response.status}`)
    }
    const d = data as Record<string, unknown>
    const meta = d.meta as Record<string, unknown> | undefined
    const page = meta?.page as Record<string, unknown> | undefined
    return {
      success: true,
      output: {
        logs: d.data ?? [],
        cursor: page?.after ?? null,
      },
    }
  },

  outputs: {
    logs: { type: 'json', description: 'Array of log events' },
    cursor: { type: 'string', description: 'Pagination cursor', optional: true },
  },
}
