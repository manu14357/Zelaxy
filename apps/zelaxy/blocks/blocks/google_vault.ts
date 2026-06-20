import { GoogleVaultIcon } from '@/components/icons/google-vault-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleVaultResponse } from '@/tools/google_vault/types'

export const GoogleVaultBlock: BlockConfig<GoogleVaultResponse> = {
  type: 'google_vault',
  name: 'Google Vault',
  description: 'Manage matters and exports in Google Vault',
  longDescription:
    'List and create matters, fetch a specific matter, and list exports through the Google Vault API. Authenticate with an OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#34A853',
  icon: GoogleVaultIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List matters', id: 'google_vault_list_matters' },
        { label: 'Get matter', id: 'google_vault_get_matter' },
        { label: 'Create matter', id: 'google_vault_create_matter' },
        { label: 'List exports', id: 'google_vault_list_exports' },
      ],
      value: () => 'google_vault_list_matters',
    },
    // Get matter / list exports
    {
      id: 'matterId',
      title: 'Matter ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '12345678901234567890',
      condition: {
        field: 'operation',
        value: ['google_vault_get_matter', 'google_vault_list_exports'],
      },
    },
    // Create matter
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'New matter name',
      condition: { field: 'operation', value: 'google_vault_create_matter' },
    },
    {
      id: 'description',
      title: 'Description',
      type: 'long-input',
      layout: 'full',
      condition: { field: 'operation', value: 'google_vault_create_matter' },
    },
    // List matters / list exports
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: {
        field: 'operation',
        value: ['google_vault_list_matters', 'google_vault_list_exports'],
      },
    },
    // Auth
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'OAuth access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_vault_list_matters',
      'google_vault_get_matter',
      'google_vault_create_matter',
      'google_vault_list_exports',
    ],
    config: {
      tool: (params) => params.operation || 'google_vault_list_matters',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'OAuth access token' },
    matterId: { type: 'string', description: 'Matter ID' },
    name: { type: 'string', description: 'Matter name' },
    description: { type: 'string', description: 'Matter description' },
    pageSize: { type: 'number', description: 'Results per page' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Vault' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
