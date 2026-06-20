import type { GrafanaListResponse, ListAlertsParams } from '@/tools/grafana/types'
import type { ToolConfig } from '@/tools/types'

export const listAlertsTool: ToolConfig<ListAlertsParams, GrafanaListResponse> = {
  id: 'grafana_list_alerts',
  name: 'Grafana List Alerts',
  description: 'List all provisioned alert rules in a Grafana instance',
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
    url: (params) => `${params.instanceUrl.replace(/\/$/, '')}/api/v1/provisioning/alert-rules`,
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
    data: { type: 'json', description: 'Array of alert rule objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of alert rules returned' },
      },
    },
  },
}
