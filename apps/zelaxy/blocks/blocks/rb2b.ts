import { Rb2bIcon } from '@/components/icons/rb2b-icon'
import type { BlockConfig } from '@/blocks/types'
import type { Rb2bResponse } from '@/tools/rb2b/types'

export const Rb2bBlock: BlockConfig<Rb2bResponse> = {
  type: 'rb2b',
  name: 'RB2B',
  description: 'Identify and retrieve website visitors',
  longDescription:
    'List website visitors identified by RB2B and retrieve a single visitor by ID through the RB2B API. Authenticate with an RB2B API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#111827',
  icon: Rb2bIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List visitors', id: 'rb2b_list_visitors' },
        { label: 'Get visitor', id: 'rb2b_get_visitor' },
      ],
      value: () => 'rb2b_list_visitors',
    },
    // List visitors
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: { field: 'operation', value: 'rb2b_list_visitors' },
    },
    // Get visitor
    {
      id: 'id',
      title: 'Visitor ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter the visitor ID',
      required: true,
      condition: { field: 'operation', value: 'rb2b_get_visitor' },
    },
    {
      id: 'apiKey',
      title: 'RB2B API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your RB2B API token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['rb2b_list_visitors', 'rb2b_get_visitor'],
    config: {
      tool: (params) => params.operation || 'rb2b_list_visitors',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'RB2B API token' },
    limit: { type: 'number', description: 'Result limit' },
    id: { type: 'string', description: 'Visitor ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from RB2B' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
