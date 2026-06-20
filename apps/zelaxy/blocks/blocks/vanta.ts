import { VantaIcon } from '@/components/icons/vanta-icon'
import type { BlockConfig } from '@/blocks/types'
import type { VantaResponse } from '@/tools/vanta/types'

export const VantaBlock: BlockConfig<VantaResponse> = {
  type: 'vanta',
  name: 'Vanta',
  description: 'List compliance tests, controls, and vendors in Vanta',
  longDescription:
    'List automated compliance tests, security controls, and tracked vendors through the Vanta API. Authenticate with a Vanta API access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6749F0',
  icon: VantaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List tests', id: 'vanta_list_tests' },
        { label: 'List controls', id: 'vanta_list_controls' },
        { label: 'List vendors', id: 'vanta_list_vendors' },
      ],
      value: () => 'vanta_list_tests',
    },
    // List tests
    {
      id: 'statusFilter',
      title: 'Status Filter',
      type: 'short-input',
      layout: 'half',
      placeholder: 'OK, NEEDS_ATTENTION, ...',
      condition: { field: 'operation', value: 'vanta_list_tests' },
    },
    {
      id: 'frameworkFilter',
      title: 'Framework Filter',
      type: 'short-input',
      layout: 'half',
      placeholder: 'soc2',
      condition: { field: 'operation', value: 'vanta_list_tests' },
    },
    {
      id: 'integrationFilter',
      title: 'Integration Filter',
      type: 'short-input',
      layout: 'half',
      placeholder: 'aws',
      condition: { field: 'operation', value: 'vanta_list_tests' },
    },
    // List controls
    {
      id: 'frameworkMatchesAny',
      title: 'Frameworks',
      type: 'short-input',
      layout: 'full',
      placeholder: 'soc2,iso27001',
      condition: { field: 'operation', value: 'vanta_list_controls' },
    },
    // List vendors
    {
      id: 'name',
      title: 'Vendor Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Vendor name',
      condition: { field: 'operation', value: 'vanta_list_vendors' },
    },
    {
      id: 'statusMatchesAny',
      title: 'Statuses',
      type: 'short-input',
      layout: 'half',
      placeholder: 'MANAGED,IN_PROCUREMENT',
      condition: { field: 'operation', value: 'vanta_list_vendors' },
    },
    // Shared pagination
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: {
        field: 'operation',
        value: ['vanta_list_tests', 'vanta_list_controls', 'vanta_list_vendors'],
      },
    },
    {
      id: 'pageCursor',
      title: 'Page Cursor',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Pagination cursor',
      condition: {
        field: 'operation',
        value: ['vanta_list_tests', 'vanta_list_controls', 'vanta_list_vendors'],
      },
    },
    {
      id: 'apiKey',
      title: 'Vanta API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Vanta API access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['vanta_list_tests', 'vanta_list_controls', 'vanta_list_vendors'],
    config: {
      tool: (params) => params.operation || 'vanta_list_tests',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Vanta API access token' },
    statusFilter: { type: 'string', description: 'Test status filter' },
    frameworkFilter: { type: 'string', description: 'Framework ID filter' },
    integrationFilter: { type: 'string', description: 'Integration ID filter' },
    frameworkMatchesAny: { type: 'string', description: 'Comma-separated framework IDs' },
    name: { type: 'string', description: 'Vendor name filter' },
    statusMatchesAny: { type: 'string', description: 'Comma-separated vendor statuses' },
    pageSize: { type: 'number', description: 'Items per page' },
    pageCursor: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result array from Vanta' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
