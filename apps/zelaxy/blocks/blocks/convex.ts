import { ConvexIcon } from '@/components/icons/convex-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ConvexResponse } from '@/tools/convex/types'

export const ConvexBlock: BlockConfig<ConvexResponse> = {
  type: 'convex',
  name: 'Convex',
  description: 'Run Convex query and mutation functions over HTTP',
  longDescription:
    'Call Convex query and mutation functions through the Convex HTTP API. Provide your deployment URL and, optionally, an admin key for admin-only functions.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F3B01C',
  icon: ConvexIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Run query', id: 'convex_run_query' },
        { label: 'Run mutation', id: 'convex_run_mutation' },
      ],
      value: () => 'convex_run_query',
    },
    // Function call
    {
      id: 'path',
      title: 'Function Path',
      type: 'short-input',
      layout: 'full',
      placeholder: 'messages:list',
      condition: { field: 'operation', value: ['convex_run_query', 'convex_run_mutation'] },
    },
    {
      id: 'args',
      title: 'Arguments (JSON)',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "channel": "general" }',
      condition: { field: 'operation', value: ['convex_run_query', 'convex_run_mutation'] },
    },
    // Connection
    {
      id: 'deploymentUrl',
      title: 'Deployment URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://xxx.convex.cloud',
      required: true,
    },
    {
      id: 'adminKey',
      title: 'Admin Key',
      type: 'short-input',
      layout: 'full',
      password: true,
    },
  ],
  tools: {
    access: ['convex_run_query', 'convex_run_mutation'],
    config: {
      tool: (params) => params.operation || 'convex_run_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    deploymentUrl: { type: 'string', description: 'Convex deployment URL' },
    adminKey: { type: 'string', description: 'Convex admin key' },
    path: { type: 'string', description: 'Function path, e.g. messages:list' },
    args: { type: 'json', description: 'Arguments object for the function' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Convex' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
