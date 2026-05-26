import { ShieldCheckIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface CredentialResponse {
  success: boolean
  output: {
    credentialId?: string
    displayName?: string
    providerId?: string
    token?: string
    credentials?: Array<{
      credentialId: string
      displayName: string
      providerId: string
    }>
    count?: number
  }
}

export const CredentialBlock: BlockConfig<CredentialResponse> = {
  type: 'credential',
  name: 'Credential',
  description: 'Retrieve OAuth credentials stored in your account',
  longDescription:
    'Look up OAuth credentials by ID or list all credentials associated with a provider. Useful for dynamic credential selection within a workflow without hard-coding secrets.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#3B82F6',
  icon: ShieldCheckIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Select credential by ID', id: 'select' },
        { label: 'List credentials by provider', id: 'list' },
      ],
      value: () => 'select',
      required: true,
    },
    {
      id: 'credentialId',
      title: 'Credential ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'cred_xxxxxxxxxxxxxxxx',
      required: true,
      condition: { field: 'operation', value: 'select' },
      description: 'The unique identifier of the OAuth credential to retrieve',
    },
    {
      id: 'provider',
      title: 'Provider Filter',
      type: 'short-input',
      layout: 'full',
      placeholder: 'google',
      condition: { field: 'operation', value: 'list' },
      description: 'Optional provider ID to filter credentials (e.g. google, github)',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    operation: {
      type: 'string',
      description: 'Operation to perform: select or list',
    },
    credentialId: {
      type: 'string',
      description: 'ID of the credential to retrieve (for select operation)',
    },
    provider: {
      type: 'string',
      description: 'Provider ID to filter credentials (for list operation)',
    },
  },
  outputs: {
    credentialId: {
      type: 'string',
      description: 'The credential ID (select operation)',
    },
    displayName: {
      type: 'string',
      description: 'Human-readable name of the credential (select operation)',
    },
    providerId: {
      type: 'string',
      description: 'OAuth provider identifier (select operation)',
    },
    token: {
      type: 'string',
      description: 'Access token for the credential (select operation)',
    },
    credentials: {
      type: 'json',
      description: 'Array of credentials matching the filter (list operation)',
    },
    count: {
      type: 'number',
      description: 'Total number of credentials returned (list operation)',
    },
  },
}
