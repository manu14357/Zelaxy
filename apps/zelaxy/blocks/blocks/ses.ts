import { SesIcon } from '@/components/icons/ses-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SesResponse } from '@/tools/ses/types'

export const SesBlock: BlockConfig<SesResponse> = {
  type: 'ses',
  name: 'Amazon SES',
  description: 'Send emails and list identities with Amazon SES v2',
  longDescription:
    'Interact with Amazon Simple Email Service (SES) v2: send transactional emails and list configured email identities. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF9900',
  icon: SesIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send email', id: 'ses_send_email' },
        { label: 'List identities', id: 'ses_list_identities' },
      ],
      value: () => 'ses_send_email',
    },
    {
      id: 'fromEmail',
      title: 'From Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'sender@example.com',
      condition: { field: 'operation', value: 'ses_send_email' },
    },
    {
      id: 'toEmail',
      title: 'To Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'recipient@example.com',
      condition: { field: 'operation', value: 'ses_send_email' },
    },
    {
      id: 'subject',
      title: 'Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Email subject',
      condition: { field: 'operation', value: 'ses_send_email' },
    },
    {
      id: 'body',
      title: 'Body',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Email body',
      condition: { field: 'operation', value: 'ses_send_email' },
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
    access: ['ses_send_email', 'ses_list_identities'],
    config: {
      tool: (params) => params.operation || 'ses_send_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    fromEmail: { type: 'string', description: 'Sender email address' },
    toEmail: { type: 'string', description: 'Recipient email address' },
    subject: { type: 'string', description: 'Email subject' },
    body: { type: 'string', description: 'Email body' },
  },
  outputs: {
    data: { type: 'json', description: 'SES API response' },
  },
}
