import { MailgunIcon } from '@/components/icons/mailgun-icon'
import type { BlockConfig } from '@/blocks/types'
import type { MailgunResponse } from '@/tools/mailgun/types'

export const MailgunBlock: BlockConfig<MailgunResponse> = {
  type: 'mailgun',
  name: 'Mailgun',
  description: 'Send emails and read delivery events with Mailgun',
  longDescription:
    'Send transactional emails and list delivery events through the Mailgun API. Authenticate with a Mailgun API key and sending domain.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#C02126',
  icon: MailgunIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send email', id: 'mailgun_send_email' },
        { label: 'List events', id: 'mailgun_list_events' },
      ],
      value: () => 'mailgun_send_email',
    },
    // Send email
    {
      id: 'from',
      title: 'From',
      type: 'short-input',
      layout: 'half',
      placeholder: 'sender@example.com',
      condition: { field: 'operation', value: 'mailgun_send_email' },
    },
    {
      id: 'to',
      title: 'To',
      type: 'short-input',
      layout: 'half',
      placeholder: 'recipient@example.com',
      condition: { field: 'operation', value: 'mailgun_send_email' },
    },
    {
      id: 'subject',
      title: 'Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Email subject',
      condition: { field: 'operation', value: 'mailgun_send_email' },
    },
    {
      id: 'text',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Email body text',
      condition: { field: 'operation', value: 'mailgun_send_email' },
    },
    // List events
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: 'mailgun_list_events' },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'mg.example.com',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Mailgun API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'key-...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['mailgun_send_email', 'mailgun_list_events'],
    config: {
      tool: (params) => params.operation || 'mailgun_send_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Mailgun API key' },
    domain: { type: 'string', description: 'Mailgun sending domain' },
    from: { type: 'string', description: 'Sender email' },
    to: { type: 'string', description: 'Recipient email' },
    subject: { type: 'string', description: 'Email subject' },
    text: { type: 'string', description: 'Email body' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Mailgun' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
