import { NewRelicIcon } from '@/components/icons/new-relic-icon'
import type { BlockConfig } from '@/blocks/types'
import type { NewRelicResponse } from '@/tools/new_relic/types'

export const NewRelicBlock: BlockConfig<NewRelicResponse> = {
  type: 'new_relic',
  name: 'New Relic',
  description: 'Query telemetry and list alert policies in New Relic',
  longDescription:
    'Run NRQL queries and list alert policies through the New Relic NerdGraph API. Authenticate with a user API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1CE783',
  icon: NewRelicIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'NRQL query', id: 'new_relic_nrql_query' },
        { label: 'List alert policies', id: 'new_relic_list_alert_policies' },
      ],
      value: () => 'new_relic_nrql_query',
    },
    {
      id: 'accountId',
      title: 'Account ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '1234567',
      required: true,
    },
    // NRQL query
    {
      id: 'nrql',
      title: 'NRQL',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT count(*) FROM Transaction SINCE 1 hour ago',
      condition: { field: 'operation', value: 'new_relic_nrql_query' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'NRAK-...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['new_relic_nrql_query', 'new_relic_list_alert_policies'],
    config: {
      tool: (params) => params.operation || 'new_relic_nrql_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'New Relic user API key' },
    accountId: { type: 'number', description: 'New Relic account ID' },
    nrql: { type: 'string', description: 'NRQL query string' },
  },
  outputs: {
    data: { type: 'json', description: 'Result array from New Relic' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
