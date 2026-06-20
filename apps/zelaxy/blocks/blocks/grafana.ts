import { GrafanaIcon } from '@/components/icons/grafana-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GrafanaResponse } from '@/tools/grafana/types'

export const GrafanaBlock: BlockConfig<GrafanaResponse> = {
  type: 'grafana',
  name: 'Grafana',
  description: 'Search dashboards and inspect data sources and alerts in Grafana',
  longDescription:
    'Search dashboards, fetch a dashboard by UID, list data sources, and list provisioned alert rules through the Grafana HTTP API. Authenticate with a service account token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F46800',
  icon: GrafanaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Search dashboards', id: 'grafana_search_dashboards' },
        { label: 'Get dashboard', id: 'grafana_get_dashboard' },
        { label: 'List datasources', id: 'grafana_list_datasources' },
        { label: 'List alerts', id: 'grafana_list_alerts' },
      ],
      value: () => 'grafana_search_dashboards',
    },
    // Search dashboards
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Filter dashboards by title',
      condition: { field: 'operation', value: 'grafana_search_dashboards' },
    },
    // Get dashboard
    {
      id: 'uid',
      title: 'Dashboard UID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'abc123def',
      condition: { field: 'operation', value: 'grafana_get_dashboard' },
    },
    // Connection
    {
      id: 'instanceUrl',
      title: 'Instance URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://your.grafana.net',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Service Account Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'glsa_...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'grafana_search_dashboards',
      'grafana_get_dashboard',
      'grafana_list_datasources',
      'grafana_list_alerts',
    ],
    config: {
      tool: (params) => params.operation || 'grafana_search_dashboards',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Grafana service account token' },
    instanceUrl: { type: 'string', description: 'Grafana instance URL' },
    query: { type: 'string', description: 'Dashboard search query' },
    uid: { type: 'string', description: 'Dashboard UID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Grafana' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
