import { FindymailIcon } from '@/components/icons/findymail-icon'
import type { BlockConfig } from '@/blocks/types'
import type { FindymailResponse } from '@/tools/findymail/types'

export const FindymailBlock: BlockConfig<FindymailResponse> = {
  type: 'findymail',
  name: 'Findymail',
  description: 'Find and verify B2B email addresses',
  longDescription:
    'Find verified email addresses from a name and company domain or a LinkedIn profile URL, and verify email deliverability through the Findymail API. Authenticate with a Findymail API key (bearer token).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#2563EB',
  icon: FindymailIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Find email', id: 'findymail_find_email' },
        { label: 'Find from LinkedIn', id: 'findymail_find_from_linkedin' },
        { label: 'Verify email', id: 'findymail_verify_email' },
      ],
      value: () => 'findymail_find_email',
    },
    // Find email
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'John Doe',
      condition: { field: 'operation', value: 'findymail_find_email' },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'half',
      placeholder: 'stripe.com',
      condition: { field: 'operation', value: 'findymail_find_email' },
    },
    // Find from LinkedIn
    {
      id: 'linkedin_url',
      title: 'LinkedIn URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://linkedin.com/in/johndoe',
      condition: { field: 'operation', value: 'findymail_find_from_linkedin' },
    },
    // Verify email
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@example.com',
      condition: { field: 'operation', value: 'findymail_verify_email' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Findymail API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['findymail_find_email', 'findymail_find_from_linkedin', 'findymail_verify_email'],
    config: {
      tool: (params) => params.operation || 'findymail_find_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Findymail API key' },
    name: { type: 'string', description: 'Person full name' },
    domain: { type: 'string', description: 'Company domain' },
    linkedin_url: { type: 'string', description: 'LinkedIn profile URL' },
    email: { type: 'string', description: 'Email address to verify' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Findymail' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
