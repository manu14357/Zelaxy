import { MailIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const EmailBisonBlock: BlockConfig = {
  type: 'emailbison',
  name: 'Email Bison',
  description: 'Find and verify email addresses with Email Bison',
  longDescription:
    'Integrate Email Bison email finder into your workflows. Find professional email addresses, verify email deliverability, and enrich contact data.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FB7A22',
  icon: MailIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Find Email', id: 'emailbison_find_email' },
        { label: 'Verify Email', id: 'emailbison_verify_email' },
        { label: 'Bulk Find Emails', id: 'emailbison_bulk_find' },
        { label: 'Domain Search', id: 'emailbison_domain_search' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Email Bison API key',
      required: true,
    },
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'John',
      condition: { field: 'operation', value: ['emailbison_find_email'] },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: ['emailbison_find_email'] },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'example.com',
      condition: {
        field: 'operation',
        value: ['emailbison_find_email', 'emailbison_domain_search'],
      },
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john@example.com',
      condition: { field: 'operation', value: ['emailbison_verify_email'] },
    },
  ],
  tools: {
    access: [
      'emailbison_find_email',
      'emailbison_verify_email',
      'emailbison_bulk_find',
      'emailbison_domain_search',
    ],
    config: {
      tool: (params) => params.operation || 'emailbison_find_email',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    domain: { type: 'string', description: 'Domain' },
    email: { type: 'string', description: 'Email to verify' },
  },
  outputs: {
    email: { type: 'string', description: 'Found email address' },
    verified: { type: 'boolean', description: 'Email verification result' },
    confidence: { type: 'number', description: 'Confidence score' },
  },
}
