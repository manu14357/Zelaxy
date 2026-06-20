import { AppConfigIcon } from '@/components/icons/appconfig-icon'
import type { BlockConfig } from '@/blocks/types'
import type { AppConfigResponse } from '@/tools/appconfig/types'

export const AppConfigBlock: BlockConfig<AppConfigResponse> = {
  type: 'appconfig',
  name: 'AWS AppConfig',
  description: 'List applications, environments, and configuration profiles in AWS AppConfig',
  longDescription:
    'Interact with the AWS AppConfig control plane: list applications, list environments for an application, and list configuration profiles. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF9900',
  icon: AppConfigIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List applications', id: 'appconfig_list_applications' },
        { label: 'List environments', id: 'appconfig_list_environments' },
        { label: 'List configuration profiles', id: 'appconfig_list_configuration_profiles' },
      ],
      value: () => 'appconfig_list_applications',
    },
    {
      id: 'applicationId',
      title: 'Application ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'abcd123',
      condition: {
        field: 'operation',
        value: ['appconfig_list_environments', 'appconfig_list_configuration_profiles'],
      },
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
      'appconfig_list_applications',
      'appconfig_list_environments',
      'appconfig_list_configuration_profiles',
    ],
    config: {
      tool: (params) => params.operation || 'appconfig_list_applications',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    applicationId: { type: 'string', description: 'AppConfig application ID' },
  },
  outputs: {
    data: { type: 'json', description: 'AppConfig API response' },
  },
}
