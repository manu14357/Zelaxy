import { SalesforceIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { SalesforceResponse } from '@/tools/salesforce/types'

export const SalesforceBlock: BlockConfig<SalesforceResponse> = {
  type: 'salesforce',
  name: 'Salesforce',
  description: 'Create, query, update, and retrieve Salesforce records',
  longDescription:
    'Create records, run SOQL queries, update records, and get records for any Salesforce sObject. Authenticate with a Salesforce access token and your instance URL.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#00A1E0',
  icon: SalesforceIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create record', id: 'salesforce_create_record' },
        { label: 'Query (SOQL)', id: 'salesforce_query' },
        { label: 'Update record', id: 'salesforce_update_record' },
        { label: 'Get record', id: 'salesforce_get_record' },
      ],
      value: () => 'salesforce_create_record',
    },
    // sObject (shared by create / update / get)
    {
      id: 'sobject',
      title: 'sObject Type',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Contact',
      condition: {
        field: 'operation',
        value: ['salesforce_create_record', 'salesforce_update_record', 'salesforce_get_record'],
      },
    },
    // Record ID (update / get)
    {
      id: 'recordId',
      title: 'Record ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '003xx000004TmiQAAS',
      condition: {
        field: 'operation',
        value: ['salesforce_update_record', 'salesforce_get_record'],
      },
    },
    // Fields (create / update)
    {
      id: 'fields',
      title: 'Fields (JSON)',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"LastName": "Doe", "Email": "john@example.com"}',
      condition: {
        field: 'operation',
        value: ['salesforce_create_record', 'salesforce_update_record'],
      },
    },
    // Get record field selection
    {
      id: 'fields',
      title: 'Fields (comma-separated)',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Id,Name,Email',
      condition: { field: 'operation', value: 'salesforce_get_record' },
    },
    // Query
    {
      id: 'query',
      title: 'SOQL Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT Id, Name FROM Account LIMIT 10',
      condition: { field: 'operation', value: 'salesforce_query' },
    },
    {
      id: 'instanceUrl',
      title: 'Instance URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://your-domain.my.salesforce.com',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Salesforce OAuth access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'salesforce_create_record',
      'salesforce_query',
      'salesforce_update_record',
      'salesforce_get_record',
    ],
    config: {
      tool: (params) => params.operation || 'salesforce_create_record',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Salesforce OAuth access token' },
    instanceUrl: { type: 'string', description: 'Salesforce instance URL' },
    sobject: { type: 'string', description: 'sObject type' },
    recordId: { type: 'string', description: 'Record ID' },
    fields: { type: 'json', description: 'Field values or fields to return' },
    query: { type: 'string', description: 'SOQL query' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Salesforce' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
