import { RipplingIcon } from '@/components/icons/rippling-icon'
import type { BlockConfig } from '@/blocks/types'
import type { RipplingResponse } from '@/tools/rippling/types'

export const RipplingBlock: BlockConfig<RipplingResponse> = {
  type: 'rippling',
  name: 'Rippling',
  description: 'List workers and companies in Rippling',
  longDescription:
    'List workers (employees), fetch a worker by ID, and list companies through the Rippling API. Authenticate with a Rippling API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FFC107',
  icon: RipplingIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List workers', id: 'rippling_list_workers' },
        { label: 'Get worker', id: 'rippling_get_worker' },
        { label: 'List companies', id: 'rippling_list_companies' },
      ],
      value: () => 'rippling_list_workers',
    },
    // Get worker
    {
      id: 'id',
      title: 'Worker ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Worker ID',
      condition: { field: 'operation', value: 'rippling_get_worker' },
    },
    // List workers
    {
      id: 'filter',
      title: 'Filter',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Filter expression',
      condition: { field: 'operation', value: 'rippling_list_workers' },
    },
    // Shared expand / order_by / cursor
    {
      id: 'expand',
      title: 'Expand',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Comma-separated fields',
      condition: {
        field: 'operation',
        value: ['rippling_list_workers', 'rippling_get_worker', 'rippling_list_companies'],
      },
    },
    {
      id: 'orderBy',
      title: 'Order By',
      type: 'short-input',
      layout: 'half',
      placeholder: 'field or -field',
      condition: {
        field: 'operation',
        value: ['rippling_list_workers', 'rippling_list_companies'],
      },
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Pagination cursor',
      condition: {
        field: 'operation',
        value: ['rippling_list_workers', 'rippling_list_companies'],
      },
    },
    {
      id: 'apiKey',
      title: 'Rippling API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Rippling API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['rippling_list_workers', 'rippling_get_worker', 'rippling_list_companies'],
    config: {
      tool: (params) => params.operation || 'rippling_list_workers',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Rippling API key' },
    id: { type: 'string', description: 'Worker ID' },
    filter: { type: 'string', description: 'Filter expression' },
    expand: { type: 'string', description: 'Comma-separated fields to expand' },
    orderBy: { type: 'string', description: 'Sort field' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Rippling' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
