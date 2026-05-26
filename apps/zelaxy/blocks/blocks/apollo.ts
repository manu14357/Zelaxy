import { UsersIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const ApolloBlock: BlockConfig = {
  type: 'apollo',
  name: 'Apollo',
  description: 'Search people, enrich contacts, and find organizations in Apollo',
  longDescription:
    'Integrate Apollo.io sales intelligence into your workflows. Search and enrich people, find organizations, and build targeted prospect lists.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1a1a2e',
  icon: UsersIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Search People', id: 'apollo_people_search' },
        { label: 'Enrich Person', id: 'apollo_people_enrich' },
        { label: 'Search Organizations', id: 'apollo_organization_search' },
        { label: 'Enrich Organization', id: 'apollo_organization_enrich' },
        { label: 'Find Email', id: 'apollo_find_email' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Apollo API key',
      required: true,
    },
    {
      id: 'personTitles',
      title: 'Job Titles (JSON array)',
      type: 'code',
      layout: 'full',
      placeholder: '["CEO", "CTO"]',
      condition: { field: 'operation', value: ['apollo_people_search'] },
    },
    {
      id: 'personLocations',
      title: 'Locations (JSON array)',
      type: 'code',
      layout: 'full',
      placeholder: '["San Francisco, CA"]',
      condition: { field: 'operation', value: ['apollo_people_search'] },
    },
    {
      id: 'organizationNames',
      title: 'Organization Names (JSON array)',
      type: 'code',
      layout: 'full',
      placeholder: '["Apple", "Google"]',
      condition: {
        field: 'operation',
        value: ['apollo_people_search', 'apollo_organization_search'],
      },
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'person@example.com',
      condition: { field: 'operation', value: ['apollo_people_enrich', 'apollo_find_email'] },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'example.com',
      condition: {
        field: 'operation',
        value: ['apollo_organization_enrich', 'apollo_organization_search'],
      },
    },
  ],
  tools: {
    access: [
      'apollo_people_search',
      'apollo_people_enrich',
      'apollo_organization_search',
      'apollo_organization_enrich',
      'apollo_find_email',
    ],
    config: {
      tool: (params) => params.operation || 'apollo_people_search',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    personTitles: { type: 'json', description: 'Job title filters' },
    personLocations: { type: 'json', description: 'Location filters' },
    organizationNames: { type: 'json', description: 'Organization name filters' },
    email: { type: 'string', description: 'Email address' },
    domain: { type: 'string', description: 'Organization domain' },
  },
  outputs: {
    people: { type: 'json', description: 'People results' },
    organizations: { type: 'json', description: 'Organization results' },
    contacts: { type: 'json', description: 'Contact details' },
  },
}
