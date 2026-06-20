import { JiraServiceManagementIcon } from '@/components/icons/jira-service-management-icon'
import type { BlockConfig } from '@/blocks/types'
import type { JiraSmResponse } from '@/tools/jira_service_management/types'

export const JiraServiceManagementBlock: BlockConfig<JiraSmResponse> = {
  type: 'jira_service_management',
  name: 'Jira Service Management',
  description: 'Manage service desks and customer requests in Jira Service Management',
  longDescription:
    'List service desks, create customer requests, retrieve a request by issue ID or key, and list requests through the Jira Service Management REST API. Authenticate with your Atlassian site URL, email, and API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#2684FF',
  icon: JiraServiceManagementIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List service desks', id: 'jira_service_management_list_servicedesks' },
        { label: 'Create request', id: 'jira_service_management_create_request' },
        { label: 'Get request', id: 'jira_service_management_get_request' },
        { label: 'List requests', id: 'jira_service_management_list_requests' },
      ],
      value: () => 'jira_service_management_list_servicedesks',
    },
    {
      id: 'serviceDeskId',
      title: 'Service Desk ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '1',
      condition: {
        field: 'operation',
        value: ['jira_service_management_create_request', 'jira_service_management_list_requests'],
      },
    },
    {
      id: 'requestTypeId',
      title: 'Request Type ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: 'jira_service_management_create_request' },
    },
    {
      id: 'requestFieldValues',
      title: 'Request Field Values',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"summary": "Need help", "description": "Details here"}',
      condition: { field: 'operation', value: 'jira_service_management_create_request' },
    },
    {
      id: 'issueIdOrKey',
      title: 'Issue ID or Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'SD-123',
      condition: { field: 'operation', value: 'jira_service_management_get_request' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: {
        field: 'operation',
        value: [
          'jira_service_management_list_servicedesks',
          'jira_service_management_list_requests',
        ],
      },
    },
    {
      id: 'siteUrl',
      title: 'Site URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://your-domain.atlassian.net',
      required: true,
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'you@example.com',
      required: true,
    },
    {
      id: 'apiToken',
      title: 'API Token',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'jira_service_management_list_servicedesks',
      'jira_service_management_create_request',
      'jira_service_management_get_request',
      'jira_service_management_list_requests',
    ],
    config: {
      tool: (params) => params.operation || 'jira_service_management_list_servicedesks',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    siteUrl: { type: 'string', description: 'Atlassian site URL' },
    email: { type: 'string', description: 'Atlassian account email' },
    apiToken: { type: 'string', description: 'Atlassian API token' },
    serviceDeskId: { type: 'string', description: 'Service desk ID' },
    requestTypeId: { type: 'string', description: 'Request type ID' },
    requestFieldValues: { type: 'json', description: 'Request field values' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Jira Service Management' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
