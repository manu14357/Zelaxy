import { UsersIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const EnrichBlock: BlockConfig = {
  type: 'enrich',
  name: 'Enrich',
  description: 'Enrich email addresses and LinkedIn profiles with Enrich.so',
  longDescription:
    'Integrate Enrich.so data enrichment into your workflows. Enrich emails to profiles, find work emails from LinkedIn, verify emails, and search companies.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E5E5E6',
  icon: UsersIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      // Only operations with a registered tool (see tools.access below) are offered, so every
      // selectable operation resolves at runtime.
      options: [
        { label: 'Email to Profile', id: 'enrich_email_to_profile' },
        { label: 'Find Email', id: 'enrich_find_email' },
        { label: 'Verify Email', id: 'enrich_verify_email' },
        { label: 'Phone Finder', id: 'enrich_phone_finder' },
        { label: 'Company Lookup', id: 'enrich_company_lookup' },
        { label: 'Search People', id: 'enrich_search_people' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Enrich API key',
      required: true,
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'person@example.com',
      condition: {
        field: 'operation',
        value: ['enrich_email_to_profile', 'enrich_verify_email'],
      },
    },
    {
      id: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://linkedin.com/in/username',
      condition: {
        field: 'operation',
        value: ['enrich_phone_finder'],
      },
    },
  ],
  tools: {
    access: [
      'enrich_email_to_profile',
      'enrich_find_email',
      'enrich_verify_email',
      'enrich_company_lookup',
      'enrich_search_people',
      'enrich_phone_finder',
    ],
    config: {
      tool: (params) => params.operation || 'enrich_email_to_profile',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    email: { type: 'string', description: 'Email address' },
    linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
  },
  outputs: {
    profile: { type: 'json', description: 'Profile data' },
    email: { type: 'string', description: 'Email address' },
    person: { type: 'json', description: 'Person data' },
    company: { type: 'json', description: 'Company data' },
  },
}
