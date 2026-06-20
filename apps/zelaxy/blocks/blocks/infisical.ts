import { InfisicalIcon } from '@/components/icons/infisical-icon'
import type { BlockConfig } from '@/blocks/types'
import type { InfisicalResponse } from '@/tools/infisical/types'

export const InfisicalBlock: BlockConfig<InfisicalResponse> = {
  type: 'infisical',
  name: 'Infisical',
  description: 'Manage secrets in an Infisical project',
  longDescription:
    'List, fetch, and create secrets in an Infisical project environment through the Infisical API. Authenticate with an API token and target a workspace and environment.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#EB5E34',
  icon: InfisicalIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List secrets', id: 'infisical_list_secrets' },
        { label: 'Get secret', id: 'infisical_get_secret' },
        { label: 'Create secret', id: 'infisical_create_secret' },
      ],
      value: () => 'infisical_list_secrets',
    },
    {
      id: 'workspaceId',
      title: 'Workspace ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Infisical project ID',
      required: true,
    },
    {
      id: 'environment',
      title: 'Environment',
      type: 'short-input',
      layout: 'half',
      placeholder: 'dev',
    },
    {
      id: 'secretName',
      title: 'Secret Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'DATABASE_URL',
      condition: {
        field: 'operation',
        value: ['infisical_get_secret', 'infisical_create_secret'],
      },
    },
    {
      id: 'secretValue',
      title: 'Secret Value',
      type: 'short-input',
      layout: 'full',
      placeholder: 'value to store',
      condition: { field: 'operation', value: 'infisical_create_secret' },
    },
    {
      id: 'apiKey',
      title: 'API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'st.xxxx...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['infisical_list_secrets', 'infisical_get_secret', 'infisical_create_secret'],
    config: {
      tool: (params) => params.operation || 'infisical_list_secrets',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Infisical API token' },
    workspaceId: { type: 'string', description: 'Infisical project ID' },
    environment: { type: 'string', description: 'Environment slug' },
    secretName: { type: 'string', description: 'Secret name' },
    secretValue: { type: 'string', description: 'Secret value' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Infisical' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
