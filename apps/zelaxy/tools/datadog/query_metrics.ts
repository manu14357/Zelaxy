import type { ToolConfig } from '@/tools/types'

export const datadogQueryMetricsTool: ToolConfig = {
  id: 'datadog_query_metrics',
  name: 'Datadog Query Metrics',
  description: 'Query Datadog metrics for a given time range and expression.',
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
      description: 'Metric query string (e.g., avg:system.cpu.user{*})',
    },
    from: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start of query period (Unix epoch seconds)',
    },
    to: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'End of query period (Unix epoch seconds)',
    },
  },

  request: {
    url: (params) => {
      const site = params.site || 'datadoghq.com'
      return `https://api.${site}/api/v1/query?query=${encodeURIComponent(params.query)}&from=${params.from}&to=${params.to}`
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
        series: (data as Record<string, unknown>).series ?? [],
        from: (data as Record<string, unknown>).from_date ?? null,
        to: (data as Record<string, unknown>).to_date ?? null,
        query: (data as Record<string, unknown>).query ?? '',
      },
    }
  },

  outputs: {
    series: { type: 'json', description: 'Array of metric series' },
    from: { type: 'number', description: 'Query start time', optional: true },
    to: { type: 'number', description: 'Query end time', optional: true },
    query: { type: 'string', description: 'The query string used' },
  },
}
