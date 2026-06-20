import { UpstashIcon } from '@/components/icons/upstash-icon'
import type { BlockConfig } from '@/blocks/types'
import type { UpstashResponse } from '@/tools/upstash/types'

export const UpstashBlock: BlockConfig<UpstashResponse> = {
  type: 'upstash',
  name: 'Upstash',
  description: 'Read, write, and run commands against Upstash Redis over HTTP',
  longDescription:
    'Get and set keys or run arbitrary Redis commands through the Upstash Redis REST API. Authenticate with your REST URL and REST token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00E9A3',
  icon: UpstashIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Redis GET', id: 'upstash_redis_get' },
        { label: 'Redis SET', id: 'upstash_redis_set' },
        { label: 'Run command', id: 'upstash_run_command' },
      ],
      value: () => 'upstash_redis_get',
    },
    // GET / SET
    {
      id: 'key',
      title: 'Key',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-key',
      condition: { field: 'operation', value: ['upstash_redis_get', 'upstash_redis_set'] },
    },
    {
      id: 'value',
      title: 'Value',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-value',
      condition: { field: 'operation', value: 'upstash_redis_set' },
    },
    // Run command
    {
      id: 'command',
      title: 'Command (JSON array)',
      type: 'long-input',
      layout: 'full',
      placeholder: '["INCR","counter"]',
      condition: { field: 'operation', value: 'upstash_run_command' },
    },
    // Connection
    {
      id: 'restUrl',
      title: 'REST URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://xxx.upstash.io',
      required: true,
    },
    {
      id: 'restToken',
      title: 'REST Token',
      type: 'short-input',
      layout: 'full',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['upstash_redis_get', 'upstash_redis_set', 'upstash_run_command'],
    config: {
      tool: (params) => params.operation || 'upstash_redis_get',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    restUrl: { type: 'string', description: 'Upstash Redis REST URL' },
    restToken: { type: 'string', description: 'Upstash Redis REST token' },
    key: { type: 'string', description: 'Redis key' },
    value: { type: 'string', description: 'Value to store' },
    command: { type: 'json', description: 'Redis command as a JSON array' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Upstash' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
