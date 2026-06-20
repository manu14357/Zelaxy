import { RootlyIcon } from '@/components/icons/rootly-icon'
import type { BlockConfig } from '@/blocks/types'
import type { RootlyResponse } from '@/tools/rootly/types'

export const RootlyBlock: BlockConfig<RootlyResponse> = {
  type: 'rootly',
  name: 'Rootly',
  description: 'Manage incidents in Rootly',
  longDescription:
    'List and create incidents and retrieve a single incident through the Rootly v1 API. Authenticate with a Bearer API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E5484D',
  icon: RootlyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List incidents', id: 'rootly_list_incidents' },
        { label: 'Create incident', id: 'rootly_create_incident' },
        { label: 'Get incident', id: 'rootly_get_incident' },
      ],
      value: () => 'rootly_list_incidents',
    },
    // List incidents
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: 'rootly_list_incidents' },
    },
    // Create incident
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'API latency spike',
      condition: { field: 'operation', value: 'rootly_create_incident' },
    },
    {
      id: 'summary',
      title: 'Summary',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Describe what is happening',
      condition: { field: 'operation', value: 'rootly_create_incident' },
    },
    // Get incident
    {
      id: 'incidentId',
      title: 'Incident ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Incident UUID',
      condition: { field: 'operation', value: 'rootly_get_incident' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Rootly API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['rootly_list_incidents', 'rootly_create_incident', 'rootly_get_incident'],
    config: {
      tool: (params) => params.operation || 'rootly_list_incidents',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Rootly API key' },
    pageSize: { type: 'number', description: 'Results per page' },
    title: { type: 'string', description: 'Incident title' },
    summary: { type: 'string', description: 'Incident summary' },
    incidentId: { type: 'string', description: 'Incident ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Rootly' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
