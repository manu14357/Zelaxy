import { StsIcon } from '@/components/icons/sts-icon'
import type { BlockConfig } from '@/blocks/types'
import type { StsResponse } from '@/tools/sts/types'

export const StsBlock: BlockConfig<StsResponse> = {
  type: 'sts',
  name: 'AWS STS',
  description: 'Get caller identity and temporary session tokens from AWS STS',
  longDescription:
    'Interact with AWS Security Token Service (STS): retrieve the identity of the calling credentials and request temporary session tokens. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#DD344C',
  icon: StsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get caller identity', id: 'sts_get_caller_identity' },
        { label: 'Get session token', id: 'sts_get_session_token' },
      ],
      value: () => 'sts_get_caller_identity',
    },
    {
      id: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'short-input',
      layout: 'half',
      placeholder: '3600',
      condition: { field: 'operation', value: 'sts_get_session_token' },
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
    access: ['sts_get_caller_identity', 'sts_get_session_token'],
    config: {
      tool: (params) => params.operation || 'sts_get_caller_identity',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    durationSeconds: { type: 'number', description: 'Session token duration in seconds' },
  },
  outputs: {
    data: { type: 'json', description: 'STS API response' },
  },
}
