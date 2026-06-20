import { MicrosoftAdIcon } from '@/components/icons/microsoft-ad-icon'
import type { BlockConfig } from '@/blocks/types'
import type { MicrosoftAdResponse } from '@/tools/microsoft_ad/types'

export const MicrosoftAdBlock: BlockConfig<MicrosoftAdResponse> = {
  type: 'microsoft_ad',
  name: 'Microsoft Entra ID',
  description: 'Manage users and groups in Microsoft Entra ID',
  longDescription:
    'List and retrieve users, list groups, and create users in Microsoft Entra ID (Azure AD) through the Microsoft Graph API. Authenticate with a Graph bearer access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0078D4',
  icon: MicrosoftAdIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List users', id: 'microsoft_ad_list_users' },
        { label: 'Get user', id: 'microsoft_ad_get_user' },
        { label: 'List groups', id: 'microsoft_ad_list_groups' },
        { label: 'Create user', id: 'microsoft_ad_create_user' },
      ],
      value: () => 'microsoft_ad_list_users',
    },
    // List users / List groups
    {
      id: 'top',
      title: 'Top',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: {
        field: 'operation',
        value: ['microsoft_ad_list_users', 'microsoft_ad_list_groups'],
      },
    },
    {
      id: 'filter',
      title: 'Filter (OData)',
      type: 'short-input',
      layout: 'full',
      placeholder: "department eq 'Sales'",
      condition: {
        field: 'operation',
        value: ['microsoft_ad_list_users', 'microsoft_ad_list_groups'],
      },
    },
    // Get user
    {
      id: 'userId',
      title: 'User ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'user@example.com',
      condition: { field: 'operation', value: 'microsoft_ad_get_user' },
    },
    // Create user
    {
      id: 'displayName',
      title: 'Display Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane Doe',
      condition: { field: 'operation', value: 'microsoft_ad_create_user' },
    },
    {
      id: 'mailNickname',
      title: 'Mail Nickname',
      type: 'short-input',
      layout: 'half',
      placeholder: 'janed',
      condition: { field: 'operation', value: 'microsoft_ad_create_user' },
    },
    {
      id: 'userPrincipalName',
      title: 'User Principal Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'jane.doe@example.com',
      condition: { field: 'operation', value: 'microsoft_ad_create_user' },
    },
    {
      id: 'password',
      title: 'Initial Password',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Strong temporary password',
      password: true,
      condition: { field: 'operation', value: 'microsoft_ad_create_user' },
    },
    // Auth / connection
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Microsoft Graph bearer access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'microsoft_ad_list_users',
      'microsoft_ad_get_user',
      'microsoft_ad_list_groups',
      'microsoft_ad_create_user',
    ],
    config: {
      tool: (params) => params.operation || 'microsoft_ad_list_users',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Microsoft Graph bearer access token' },
    top: { type: 'number', description: 'Maximum results to return' },
    filter: { type: 'string', description: 'OData filter expression' },
    userId: { type: 'string', description: 'User ID or user principal name' },
    displayName: { type: 'string', description: 'Display name' },
    mailNickname: { type: 'string', description: 'Mail alias' },
    userPrincipalName: { type: 'string', description: 'User principal name' },
    password: { type: 'string', description: 'Initial password' },
    accountEnabled: { type: 'boolean', description: 'Whether the account is enabled' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Microsoft Graph' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
