import { SecretsManagerIcon } from '@/components/icons/secrets-manager-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SecretsManagerResponse } from '@/tools/secrets_manager/types'

export const SecretsManagerBlock: BlockConfig<SecretsManagerResponse> = {
  type: 'secrets_manager',
  name: 'AWS Secrets Manager',
  description: 'Get, list, and create secrets in AWS Secrets Manager',
  longDescription:
    'Interact with AWS Secrets Manager: retrieve secret values, list secrets, and create new secrets. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#DD344C',
  icon: SecretsManagerIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get secret value', id: 'secrets_manager_get_secret_value' },
        { label: 'List secrets', id: 'secrets_manager_list_secrets' },
        { label: 'Create secret', id: 'secrets_manager_create_secret' },
      ],
      value: () => 'secrets_manager_get_secret_value',
    },
    {
      id: 'secretId',
      title: 'Secret ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'The ARN or name of the secret',
      condition: { field: 'operation', value: 'secrets_manager_get_secret_value' },
    },
    {
      id: 'maxResults',
      title: 'Max Results',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: 'secrets_manager_list_secrets' },
    },
    {
      id: 'name',
      title: 'Secret Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-secret',
      condition: { field: 'operation', value: 'secrets_manager_create_secret' },
    },
    {
      id: 'secretString',
      title: 'Secret Value',
      type: 'long-input',
      layout: 'full',
      placeholder: 'The secret value to store',
      condition: { field: 'operation', value: 'secrets_manager_create_secret' },
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
      'secrets_manager_get_secret_value',
      'secrets_manager_list_secrets',
      'secrets_manager_create_secret',
    ],
    config: {
      tool: (params) => params.operation || 'secrets_manager_get_secret_value',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    secretId: { type: 'string', description: 'Secret ARN or name' },
    maxResults: { type: 'number', description: 'Max number of secrets to return' },
    name: { type: 'string', description: 'New secret name' },
    secretString: { type: 'string', description: 'New secret value' },
  },
  outputs: {
    data: { type: 'json', description: 'Secrets Manager API response' },
  },
}
