import { PipedriveIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { PipedriveResponse } from '@/tools/pipedrive/types'

export const PipedriveBlock: BlockConfig<PipedriveResponse> = {
  type: 'pipedrive',
  name: 'Pipedrive',
  description: 'Manage deals and persons in Pipedrive CRM',
  longDescription:
    'Create and list deals, create persons, and search deals in Pipedrive CRM. Authenticate with a Pipedrive API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#017737',
  icon: PipedriveIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create deal', id: 'pipedrive_create_deal' },
        { label: 'List deals', id: 'pipedrive_list_deals' },
        { label: 'Create person', id: 'pipedrive_create_person' },
        { label: 'Search deals', id: 'pipedrive_search_deals' },
      ],
      value: () => 'pipedrive_create_deal',
    },
    // Create deal
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enterprise Software License',
      condition: { field: 'operation', value: 'pipedrive_create_deal' },
    },
    {
      id: 'value',
      title: 'Value',
      type: 'short-input',
      layout: 'half',
      placeholder: '5000',
      condition: { field: 'operation', value: 'pipedrive_create_deal' },
    },
    {
      id: 'currency',
      title: 'Currency',
      type: 'short-input',
      layout: 'half',
      placeholder: 'USD',
      condition: { field: 'operation', value: 'pipedrive_create_deal' },
    },
    {
      id: 'stage_id',
      title: 'Stage ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '2',
      condition: { field: 'operation', value: 'pipedrive_create_deal' },
    },
    // Person ID / org ID (create deal)
    {
      id: 'person_id',
      title: 'Person ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '456',
      condition: { field: 'operation', value: 'pipedrive_create_deal' },
    },
    // Create person
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Jane Doe',
      condition: { field: 'operation', value: 'pipedrive_create_person' },
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'jane@example.com',
      condition: { field: 'operation', value: 'pipedrive_create_person' },
    },
    {
      id: 'phone',
      title: 'Phone',
      type: 'short-input',
      layout: 'half',
      placeholder: '+15551234567',
      condition: { field: 'operation', value: 'pipedrive_create_person' },
    },
    // Org ID (shared by create deal / create person)
    {
      id: 'org_id',
      title: 'Organization ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '789',
      condition: {
        field: 'operation',
        value: ['pipedrive_create_deal', 'pipedrive_create_person'],
      },
    },
    // Search deals
    {
      id: 'term',
      title: 'Search Term',
      type: 'short-input',
      layout: 'full',
      placeholder: 'enterprise',
      condition: { field: 'operation', value: 'pipedrive_search_deals' },
    },
    // Status (list deals)
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'open',
      condition: { field: 'operation', value: 'pipedrive_list_deals' },
    },
    // Limit (list / search)
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: {
        field: 'operation',
        value: ['pipedrive_list_deals', 'pipedrive_search_deals'],
      },
    },
    {
      id: 'apiKey',
      title: 'Pipedrive API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Pipedrive API token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'pipedrive_create_deal',
      'pipedrive_list_deals',
      'pipedrive_create_person',
      'pipedrive_search_deals',
    ],
    config: {
      tool: (params) => params.operation || 'pipedrive_create_deal',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Pipedrive API token' },
    title: { type: 'string', description: 'Deal title' },
    value: { type: 'number', description: 'Deal value' },
    currency: { type: 'string', description: 'Currency code' },
    person_id: { type: 'number', description: 'Person ID' },
    org_id: { type: 'number', description: 'Organization ID' },
    stage_id: { type: 'number', description: 'Stage ID' },
    status: { type: 'string', description: 'Deal status' },
    name: { type: 'string', description: 'Person name' },
    email: { type: 'string', description: 'Person email' },
    phone: { type: 'string', description: 'Person phone' },
    term: { type: 'string', description: 'Search term' },
    limit: { type: 'number', description: 'Result limit' },
    start: { type: 'number', description: 'Pagination start offset' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Pipedrive' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
