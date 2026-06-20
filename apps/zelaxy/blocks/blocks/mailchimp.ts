import { MailchimpIcon } from '@/components/icons/mailchimp-icon'
import type { BlockConfig } from '@/blocks/types'
import type { MailchimpResponse } from '@/tools/mailchimp/types'

export const MailchimpBlock: BlockConfig<MailchimpResponse> = {
  type: 'mailchimp',
  name: 'Mailchimp',
  description: 'Manage audiences and members in Mailchimp',
  longDescription:
    'Add members to an audience, list members, and get audience details through the Mailchimp Marketing API. Authenticate with a Mailchimp API key and data center.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FFE01B',
  icon: MailchimpIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Add member', id: 'mailchimp_add_member' },
        { label: 'List members', id: 'mailchimp_list_members' },
        { label: 'Get list', id: 'mailchimp_get_list' },
      ],
      value: () => 'mailchimp_add_member',
    },
    {
      id: 'listId',
      title: 'List ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Audience ID',
      condition: {
        field: 'operation',
        value: ['mailchimp_add_member', 'mailchimp_list_members', 'mailchimp_get_list'],
      },
    },
    // Add member
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'subscriber@example.com',
      condition: { field: 'operation', value: 'mailchimp_add_member' },
    },
    {
      id: 'dc',
      title: 'Data Center',
      type: 'short-input',
      layout: 'half',
      placeholder: 'us21',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Mailchimp API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: '...-us21',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['mailchimp_add_member', 'mailchimp_list_members', 'mailchimp_get_list'],
    config: {
      tool: (params) => params.operation || 'mailchimp_add_member',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Mailchimp API key' },
    dc: { type: 'string', description: 'Mailchimp data center' },
    listId: { type: 'string', description: 'Audience (list) ID' },
    email: { type: 'string', description: 'Subscriber email' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Mailchimp' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
