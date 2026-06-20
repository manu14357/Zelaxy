import type { GrafanaListResponse, SearchDashboardsParams } from '@/tools/grafana/types'
import type { ToolConfig } from '@/tools/types'

export const searchDashboardsTool: ToolConfig<SearchDashboardsParams, GrafanaListResponse> = {
  id: 'grafana_search_dashboards',
  name: 'Grafana Search Dashboards',
  description: 'Search and list dashboards in a Grafana instance',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Grafana service account token',
    },
    instanceUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Grafana instance URL (e.g. https://your.grafana.net)',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search query to filter dashboards by title',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`${params.instanceUrl.replace(/\/$/, '')}/api/search`)
      url.searchParams.append('type', 'dash-db')
      if (params.query) url.searchParams.append('query', params.query)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const list = Array.isArray(data) ? data : []
    return {
      success: true,
      output: { data: list, metadata: { count: list.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of dashboard search results' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of dashboards returned' },
      },
    },
  },
}
