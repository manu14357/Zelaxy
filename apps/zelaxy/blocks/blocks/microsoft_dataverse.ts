import { MicrosoftDataverseIcon } from '@/components/icons/microsoft-dataverse-icon'
import type { BlockConfig } from '@/blocks/types'
import type { DataverseResponse } from '@/tools/microsoft_dataverse/types'

export const MicrosoftDataverseBlock: BlockConfig<DataverseResponse> = {
  type: 'microsoft_dataverse',
  name: 'Microsoft Dataverse',
  description: 'Query and manage records in Microsoft Dataverse',
  longDescription:
    'Query records, create records, and retrieve records from Microsoft Dataverse tables using the OData Web API. Authenticate with a bearer access token and your Dataverse environment URL.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0078D4',
  icon: MicrosoftDataverseIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query records', id: 'microsoft_dataverse_query_records' },
        { label: 'Create record', id: 'microsoft_dataverse_create_record' },
        { label: 'Get record', id: 'microsoft_dataverse_get_record' },
      ],
      value: () => 'microsoft_dataverse_query_records',
    },
    {
      id: 'entitySetName',
      title: 'Entity Set Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'accounts',
      condition: {
        field: 'operation',
        value: [
          'microsoft_dataverse_query_records',
          'microsoft_dataverse_create_record',
          'microsoft_dataverse_get_record',
        ],
      },
    },
    // Query records
    {
      id: 'filter',
      title: 'Filter (OData)',
      type: 'short-input',
      layout: 'full',
      placeholder: 'statecode eq 0',
      condition: { field: 'operation', value: 'microsoft_dataverse_query_records' },
    },
    {
      id: 'top',
      title: 'Top',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'microsoft_dataverse_query_records' },
    },
    // Create record
    {
      id: 'fields',
      title: 'Fields',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "name": "Contoso Ltd" }',
      condition: { field: 'operation', value: 'microsoft_dataverse_create_record' },
    },
    // Get record
    {
      id: 'recordId',
      title: 'Record ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '00000000-0000-0000-0000-000000000000',
      condition: { field: 'operation', value: 'microsoft_dataverse_get_record' },
    },
    // Auth / connection
    {
      id: 'orgUrl',
      title: 'Organization URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://myorg.crm.dynamics.com',
      required: true,
    },
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Bearer access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'microsoft_dataverse_query_records',
      'microsoft_dataverse_create_record',
      'microsoft_dataverse_get_record',
    ],
    config: {
      tool: (params) => params.operation || 'microsoft_dataverse_query_records',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'OAuth bearer access token' },
    orgUrl: { type: 'string', description: 'Dataverse environment URL' },
    entitySetName: { type: 'string', description: 'Entity set name (plural table name)' },
    filter: { type: 'string', description: 'OData $filter expression' },
    top: { type: 'number', description: 'Maximum records to return' },
    fields: { type: 'json', description: 'Record fields as JSON' },
    recordId: { type: 'string', description: 'Record GUID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Dataverse' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
