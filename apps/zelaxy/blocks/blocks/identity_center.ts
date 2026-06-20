import { IdentityCenterIcon } from '@/components/icons/identity-center-icon'
import type { BlockConfig } from '@/blocks/types'
import type { IdentityCenterResponse } from '@/tools/identity_center/types'

export const IdentityCenterBlock: BlockConfig<IdentityCenterResponse> = {
  type: 'identity_center',
  name: 'AWS IAM Identity Center',
  description: 'List users and groups, and resolve user IDs in an IAM Identity Center store',
  longDescription:
    'Interact with the AWS IAM Identity Center Identity Store API: list users, list groups, and resolve a user ID by user name. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF9900',
  icon: IdentityCenterIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List users', id: 'identity_center_list_users' },
        { label: 'List groups', id: 'identity_center_list_groups' },
        { label: 'Get user ID', id: 'identity_center_get_user_id' },
      ],
      value: () => 'identity_center_list_users',
    },
    {
      id: 'identityStoreId',
      title: 'Identity Store ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'd-1234567890',
      condition: {
        field: 'operation',
        value: [
          'identity_center_list_users',
          'identity_center_list_groups',
          'identity_center_get_user_id',
        ],
      },
    },
    {
      id: 'userName',
      title: 'User Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'jdoe',
      condition: { field: 'operation', value: 'identity_center_get_user_id' },
    },
    {
      id: 'awsRegion',
      title: 'AWS Region',
      type: 'short-input',
      layout: 'half',
      placeholder: 'us-east-1',
      required: true,
    },
    {
      id: 'awsAccessKeyId',
      title: 'AWS Access Key ID',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
    {
      id: 'awsSecretAccessKey',
      title: 'AWS Secret Access Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'identity_center_list_users',
      'identity_center_list_groups',
      'identity_center_get_user_id',
    ],
    config: {
      tool: (params) => params.operation || 'identity_center_list_users',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    identityStoreId: { type: 'string', description: 'Identity store ID' },
    userName: { type: 'string', description: 'User name to resolve' },
  },
  outputs: {
    data: { type: 'json', description: 'Identity Store API response' },
  },
}
