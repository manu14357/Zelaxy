import { GongIcon } from '@/components/icons/gong-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GongResponse } from '@/tools/gong/types'

export const GongBlock: BlockConfig<GongResponse> = {
  type: 'gong',
  name: 'Gong',
  description: 'Retrieve calls and users from Gong',
  longDescription:
    'List calls by date range, retrieve a specific call, and list users through the Gong API. Authenticate with a Gong Access Key and Access Key Secret.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#8039DF',
  icon: GongIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List calls', id: 'gong_list_calls' },
        { label: 'Get call', id: 'gong_get_call' },
        { label: 'List users', id: 'gong_list_users' },
      ],
      value: () => 'gong_list_calls',
    },
    {
      id: 'fromDateTime',
      title: 'From Date/Time',
      type: 'short-input',
      layout: 'half',
      placeholder: '2024-01-01T00:00:00Z',
      condition: { field: 'operation', value: 'gong_list_calls' },
    },
    {
      id: 'toDateTime',
      title: 'To Date/Time',
      type: 'short-input',
      layout: 'half',
      placeholder: '2024-01-31T23:59:59Z',
      condition: { field: 'operation', value: 'gong_list_calls' },
    },
    {
      id: 'callId',
      title: 'Call ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Gong call ID',
      condition: { field: 'operation', value: 'gong_get_call' },
    },
    {
      id: 'accessKey',
      title: 'Access Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Gong API Access Key',
      password: true,
      required: true,
    },
    {
      id: 'accessKeySecret',
      title: 'Access Key Secret',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Gong API Access Key Secret',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'gong',
      availableTriggers: ['gong_webhook'],
    },
  ],
  tools: {
    access: ['gong_list_calls', 'gong_get_call', 'gong_list_users'],
    config: {
      tool: (params) => params.operation || 'gong_list_calls',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessKey: { type: 'string', description: 'Gong API Access Key' },
    accessKeySecret: { type: 'string', description: 'Gong API Access Key Secret' },
    fromDateTime: { type: 'string', description: 'Start date/time in ISO-8601 format' },
    toDateTime: { type: 'string', description: 'End date/time in ISO-8601 format' },
    callId: { type: 'string', description: 'Gong call ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Gong' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'Gong event type (trigger events)' },
    call_id: { type: 'string', description: 'Gong call ID' },
    call_title: { type: 'string', description: 'Call title' },
    call_url: { type: 'string', description: 'Link to the call' },
  },
  triggers: {
    enabled: true,
    available: ['gong_webhook'],
  },
}
