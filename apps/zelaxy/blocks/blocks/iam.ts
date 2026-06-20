import { IamIcon } from '@/components/icons/iam-icon'
import type { BlockConfig } from '@/blocks/types'
import type { IamResponse } from '@/tools/iam/types'

export const IamBlock: BlockConfig<IamResponse> = {
  type: 'iam',
  name: 'AWS IAM',
  description: 'List users and roles, and get user details on AWS IAM',
  longDescription:
    'Interact with AWS Identity and Access Management (IAM): list users, list roles, and get user details. Authenticate with AWS access key credentials (SigV4 signed). IAM is a global service signed against us-east-1.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#DD344C',
  icon: IamIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List users', id: 'iam_list_users' },
        { label: 'List roles', id: 'iam_list_roles' },
        { label: 'Get user', id: 'iam_get_user' },
      ],
      value: () => 'iam_list_users',
    },
    {
      id: 'userName',
      title: 'User Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-iam-user',
      condition: { field: 'operation', value: 'iam_get_user' },
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
    access: ['iam_list_users', 'iam_list_roles', 'iam_get_user'],
    config: {
      tool: (params) => params.operation || 'iam_list_users',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    userName: { type: 'string', description: 'IAM user name' },
  },
  outputs: {
    data: { type: 'json', description: 'IAM API response' },
  },
}
