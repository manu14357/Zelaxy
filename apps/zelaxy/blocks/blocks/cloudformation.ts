import { AtomIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CloudFormationBlock: BlockConfig = {
  type: 'cloudformation',
  name: 'CloudFormation',
  description: 'Manage AWS CloudFormation stacks and templates',
  longDescription:
    'Integrate AWS CloudFormation into your workflows. Describe stacks, list resources, detect drift, validate templates, and get stack details.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#B0084D',
  icon: AtomIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Describe Stacks', id: 'cloudformation_describe_stacks' },
        { label: 'List Stack Resources', id: 'cloudformation_list_stack_resources' },
        { label: 'Describe Stack Events', id: 'cloudformation_describe_stack_events' },
        { label: 'Detect Stack Drift', id: 'cloudformation_detect_stack_drift' },
        { label: 'Get Template', id: 'cloudformation_get_template' },
        { label: 'Validate Template', id: 'cloudformation_validate_template' },
      ],
      required: true,
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
      title: 'Access Key ID',
      type: 'short-input',
      layout: 'half',
      password: true,
      placeholder: 'AKIAIOSFODNN7EXAMPLE',
      required: true,
    },
    {
      id: 'awsSecretAccessKey',
      title: 'Secret Access Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Secret access key',
      required: true,
    },
    {
      id: 'stackName',
      title: 'Stack Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-stack',
      condition: {
        field: 'operation',
        value: [
          'cloudformation_describe_stacks',
          'cloudformation_list_stack_resources',
          'cloudformation_describe_stack_events',
          'cloudformation_detect_stack_drift',
          'cloudformation_get_template',
        ],
      },
    },
    {
      id: 'templateBody',
      title: 'Template Body',
      type: 'code',
      layout: 'full',
      placeholder: 'AWSTemplateFormatVersion: "2010-09-09"',
      condition: { field: 'operation', value: ['cloudformation_validate_template'] },
    },
  ],
  tools: {
    access: [
      'cloudformation_describe_stacks',
      'cloudformation_list_stack_resources',
      'cloudformation_describe_stack_events',
      'cloudformation_detect_stack_drift',
      'cloudformation_get_template',
      'cloudformation_validate_template',
    ],
    config: {
      tool: (params) => params.operation || 'cloudformation_describe_stacks',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    stackName: { type: 'string', description: 'Stack name' },
    templateBody: { type: 'string', description: 'CloudFormation template' },
  },
  outputs: {
    stacks: { type: 'json', description: 'Stack list' },
    resources: { type: 'json', description: 'Stack resources' },
    template: { type: 'json', description: 'Stack template' },
  },
}
