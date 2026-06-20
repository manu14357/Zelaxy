import { ClickhouseIcon } from '@/components/icons/clickhouse-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ClickhouseResponse } from '@/tools/clickhouse/types'

export const ClickhouseBlock: BlockConfig<ClickhouseResponse> = {
  type: 'clickhouse',
  name: 'ClickHouse',
  description: 'Run SQL queries against ClickHouse over HTTP',
  longDescription:
    'Execute SQL queries and health checks against a ClickHouse instance through its HTTP interface. Authenticate with username and password over Basic auth.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FFCC01',
  icon: ClickhouseIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query', id: 'clickhouse_query' },
        { label: 'Ping', id: 'clickhouse_ping' },
      ],
      value: () => 'clickhouse_query',
    },
    // Query
    {
      id: 'sql',
      title: 'SQL',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT * FROM system.tables LIMIT 10',
      condition: { field: 'operation', value: 'clickhouse_query' },
    },
    // Connection
    {
      id: 'host',
      title: 'Host',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://xxx.clickhouse.cloud:8443',
      required: true,
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'default',
      required: true,
    },
    {
      id: 'password',
      title: 'Password',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['clickhouse_query', 'clickhouse_ping'],
    config: {
      tool: (params) => params.operation || 'clickhouse_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    host: { type: 'string', description: 'Full base URL of the ClickHouse instance' },
    username: { type: 'string', description: 'ClickHouse username' },
    password: { type: 'string', description: 'ClickHouse password' },
    sql: { type: 'string', description: 'SQL query to execute' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from ClickHouse' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
