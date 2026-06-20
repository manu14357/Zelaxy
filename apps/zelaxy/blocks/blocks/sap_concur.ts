import { SapConcurIcon } from '@/components/icons/sap-concur-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SapConcurResponse } from '@/tools/sap_concur/types'

export const SapConcurBlock: BlockConfig<SapConcurResponse> = {
  type: 'sap_concur',
  name: 'SAP Concur',
  description: 'List expense reports and users in SAP Concur',
  longDescription:
    'List and retrieve expense reports and list users from SAP Concur via the v3.0 Expense and Common APIs. Authenticate with a SAP Concur OAuth bearer access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#D9272E',
  icon: SapConcurIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List reports', id: 'sap_concur_list_reports' },
        { label: 'Get report', id: 'sap_concur_get_report' },
        { label: 'List users', id: 'sap_concur_list_users' },
      ],
      value: () => 'sap_concur_list_reports',
    },
    // Get report
    {
      id: 'reportId',
      title: 'Report ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '39BD9F7C5C3F4986A6A5',
      condition: { field: 'operation', value: 'sap_concur_get_report' },
    },
    // Reports (user filter)
    {
      id: 'user',
      title: 'User',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user@example.com or ALL',
      condition: {
        field: 'operation',
        value: ['sap_concur_list_reports', 'sap_concur_get_report'],
      },
    },
    {
      id: 'approvalStatusCode',
      title: 'Approval Status Code',
      type: 'short-input',
      layout: 'half',
      placeholder: 'A_APPR',
      condition: { field: 'operation', value: 'sap_concur_list_reports' },
    },
    // Users
    {
      id: 'primaryEmail',
      title: 'Primary Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'user@example.com',
      condition: { field: 'operation', value: 'sap_concur_list_users' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: {
        field: 'operation',
        value: ['sap_concur_list_reports', 'sap_concur_list_users'],
      },
    },
    // Auth
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'SAP Concur OAuth bearer token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['sap_concur_list_reports', 'sap_concur_get_report', 'sap_concur_list_users'],
    config: {
      tool: (params) => params.operation || 'sap_concur_list_reports',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'SAP Concur bearer access token' },
    reportId: { type: 'string', description: 'Expense report ID' },
    user: { type: 'string', description: 'User login ID filter' },
    approvalStatusCode: { type: 'string', description: 'Approval status code filter' },
    primaryEmail: { type: 'string', description: 'Primary email filter' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from SAP Concur' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
