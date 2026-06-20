import { LeadMagicIcon } from '@/components/icons/leadmagic-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LeadMagicResponse } from '@/tools/leadmagic/types'

export const LeadMagicBlock: BlockConfig<LeadMagicResponse> = {
  type: 'leadmagic',
  name: 'LeadMagic',
  description: 'Find emails, enrich profiles, and validate emails with LeadMagic',
  longDescription:
    'Find verified work emails from a name and company, enrich LinkedIn profiles, and validate email deliverability through the LeadMagic API. Authenticate with an API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6E56CF',
  icon: LeadMagicIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Find email', id: 'leadmagic_email_finder' },
        { label: 'Profile search', id: 'leadmagic_profile_search' },
        { label: 'Validate email', id: 'leadmagic_email_validate' },
      ],
      value: () => 'leadmagic_email_finder',
    },
    // Email finder
    {
      id: 'first_name',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: 'leadmagic_email_finder' },
    },
    {
      id: 'last_name',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Doe',
      condition: { field: 'operation', value: 'leadmagic_email_finder' },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'half',
      placeholder: 'stripe.com',
      condition: { field: 'operation', value: 'leadmagic_email_finder' },
    },
    {
      id: 'company_name',
      title: 'Company Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Stripe',
      condition: { field: 'operation', value: 'leadmagic_email_finder' },
    },
    // Profile search
    {
      id: 'profile_url',
      title: 'Profile URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://linkedin.com/in/janedoe',
      condition: { field: 'operation', value: 'leadmagic_profile_search' },
    },
    // Validate email
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'jane@example.com',
      condition: { field: 'operation', value: 'leadmagic_email_validate' },
    },
    {
      id: 'apiKey',
      title: 'LeadMagic API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your LeadMagic API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['leadmagic_email_finder', 'leadmagic_profile_search', 'leadmagic_email_validate'],
    config: {
      tool: (params) => params.operation || 'leadmagic_email_finder',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'LeadMagic API key' },
    first_name: { type: 'string', description: 'First name' },
    last_name: { type: 'string', description: 'Last name' },
    domain: { type: 'string', description: 'Company domain' },
    company_name: { type: 'string', description: 'Company name' },
    profile_url: { type: 'string', description: 'LinkedIn profile URL' },
    email: { type: 'string', description: 'Email address' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from LeadMagic' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
