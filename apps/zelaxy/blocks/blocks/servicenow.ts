import { ServiceNowIcon } from '@/components/icons/servicenow-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ServiceNowResponse } from '@/tools/servicenow/types'

export const ServiceNowBlock: BlockConfig<ServiceNowResponse> = {
  type: 'servicenow',
  name: 'ServiceNow',
  description: 'Query, create, read, and update records in ServiceNow tables',
  longDescription:
    'Work with the ServiceNow Table API to query records with encoded queries, create new records, read a record by sys_id, and update existing records. Authenticate with your instance URL and Basic auth credentials.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#62D84E',
  icon: ServiceNowIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query table', id: 'servicenow_query_table' },
        { label: 'Create record', id: 'servicenow_create_record' },
        { label: 'Get record', id: 'servicenow_get_record' },
        { label: 'Update record', id: 'servicenow_update_record' },
      ],
      value: () => 'servicenow_query_table',
    },
    {
      id: 'tableName',
      title: 'Table Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'incident',
      required: true,
    },
    {
      id: 'query',
      title: 'Encoded Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'active=true^priority=1',
      condition: { field: 'operation', value: 'servicenow_query_table' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'servicenow_query_table' },
    },
    {
      id: 'sysId',
      title: 'Record sys_id',
      type: 'short-input',
      layout: 'full',
      placeholder: '6816f79cc0a8016401c5a33be04be441',
      condition: {
        field: 'operation',
        value: ['servicenow_get_record', 'servicenow_update_record'],
      },
    },
    {
      id: 'fields',
      title: 'Fields',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"short_description": "Issue title", "priority": "1"}',
      condition: {
        field: 'operation',
        value: ['servicenow_create_record', 'servicenow_update_record'],
      },
    },
    {
      id: 'instanceUrl',
      title: 'Instance URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://dev12345.service-now.com',
      required: true,
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'admin',
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
    access: [
      'servicenow_query_table',
      'servicenow_create_record',
      'servicenow_get_record',
      'servicenow_update_record',
    ],
    config: {
      tool: (params) => params.operation || 'servicenow_query_table',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    instanceUrl: { type: 'string', description: 'ServiceNow instance URL' },
    username: { type: 'string', description: 'ServiceNow username' },
    password: { type: 'string', description: 'ServiceNow password' },
    tableName: { type: 'string', description: 'Table name' },
    sysId: { type: 'string', description: 'Record sys_id' },
    fields: { type: 'json', description: 'Field values' },
    query: { type: 'string', description: 'Encoded query' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result record or array from ServiceNow' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
