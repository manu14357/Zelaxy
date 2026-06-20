import type { GrafanaListResponse, ListDatasourcesParams } from '@/tools/grafana/types'
import type { ToolConfig } from '@/tools/types'

export const listDatasourcesTool: ToolConfig<ListDatasourcesParams, GrafanaListResponse> = {
  id: 'grafana_list_datasources',
  name: 'Grafana List Datasources',
  description: 'List all data sources configured in a Grafana instance',
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
  },

  request: {
    url: (params) => `${params.instanceUrl.replace(/\/$/, '')}/api/datasources`,
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
    data: { type: 'json', description: 'Array of data source objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of data sources returned' },
      },
    },
  },
}
