import type { GetDashboardParams, GrafanaObjectResponse } from '@/tools/grafana/types'
import type { ToolConfig } from '@/tools/types'

export const getDashboardTool: ToolConfig<GetDashboardParams, GrafanaObjectResponse> = {
  id: 'grafana_get_dashboard',
  name: 'Grafana Get Dashboard',
  description: 'Get a Grafana dashboard by its UID',
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
    uid: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'UID of the dashboard to retrieve',
    },
  },

  request: {
    url: (params) =>
      `${params.instanceUrl.replace(/\/$/, '')}/api/dashboards/uid/${params.uid.trim()}`,
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
      output: { data, metadata: { uid: data?.dashboard?.uid } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The dashboard object and metadata' },
    metadata: {
      type: 'json',
      description: 'Dashboard identifiers',
      properties: {
        uid: { type: 'string', description: 'Dashboard UID' },
      },
    },
  },
}
