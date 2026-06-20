import { TinybirdIcon } from '@/components/icons/tinybird-icon'
import type { BlockConfig } from '@/blocks/types'
import type { TinybirdResponse } from '@/tools/tinybird/types'

export const TinybirdBlock: BlockConfig<TinybirdResponse> = {
  type: 'tinybird',
  name: 'Tinybird',
  description: 'Query data and list resources in Tinybird',
  longDescription:
    'Run SQL queries and list pipes and data sources in your Tinybird workspace through the Tinybird API. Authenticate with an API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#27F795',
  icon: TinybirdIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query', id: 'tinybird_query' },
        { label: 'List pipes', id: 'tinybird_list_pipes' },
        { label: 'List data sources', id: 'tinybird_list_datasources' },
      ],
      value: () => 'tinybird_query',
    },
    // Query
    {
      id: 'sql',
      title: 'SQL',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT * FROM my_pipe LIMIT 10',
      condition: { field: 'operation', value: 'tinybird_query' },
    },
    // Connection
    {
      id: 'apiKey',
      title: 'API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'p.eyJ...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['tinybird_query', 'tinybird_list_pipes', 'tinybird_list_datasources'],
    config: {
      tool: (params) => params.operation || 'tinybird_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Tinybird API token' },
    sql: { type: 'string', description: 'SQL query to execute' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Tinybird' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
