import { SendgridIcon } from '@/components/icons/sendgrid-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SendgridResponse } from '@/tools/sendgrid/types'

export const SendgridBlock: BlockConfig<SendgridResponse> = {
  type: 'sendgrid',
  name: 'SendGrid',
  description: 'Send emails and manage marketing contacts in SendGrid',
  longDescription:
    'Send transactional emails and add or list marketing contacts through the SendGrid API. Authenticate with a SendGrid API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1A82E2',
  icon: SendgridIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Send email', id: 'sendgrid_send_email' },
        { label: 'Add contact', id: 'sendgrid_add_contact' },
        { label: 'List contacts', id: 'sendgrid_list_contacts' },
      ],
      value: () => 'sendgrid_send_email',
    },
    // Send email
    {
      id: 'to',
      title: 'To',
      type: 'short-input',
      layout: 'half',
      placeholder: 'recipient@example.com',
      condition: { field: 'operation', value: 'sendgrid_send_email' },
    },
    {
      id: 'from',
      title: 'From',
      type: 'short-input',
      layout: 'half',
      placeholder: 'sender@example.com',
      condition: { field: 'operation', value: 'sendgrid_send_email' },
    },
    {
      id: 'subject',
      title: 'Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Email subject',
      condition: { field: 'operation', value: 'sendgrid_send_email' },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Email body text',
      condition: { field: 'operation', value: 'sendgrid_send_email' },
    },
    // Add contact
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'contact@example.com',
      condition: { field: 'operation', value: 'sendgrid_add_contact' },
    },
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: 'sendgrid_add_contact' },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: 'sendgrid_add_contact' },
    },
    {
      id: 'apiKey',
      title: 'SendGrid API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'SG....',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['sendgrid_send_email', 'sendgrid_add_contact', 'sendgrid_list_contacts'],
    config: {
      tool: (params) => params.operation || 'sendgrid_send_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'SendGrid API key' },
    to: { type: 'string', description: 'Recipient email' },
    from: { type: 'string', description: 'Sender email' },
    subject: { type: 'string', description: 'Email subject' },
    content: { type: 'string', description: 'Email body' },
    email: { type: 'string', description: 'Contact email' },
    firstName: { type: 'string', description: 'Contact first name' },
    lastName: { type: 'string', description: 'Contact last name' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from SendGrid' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
