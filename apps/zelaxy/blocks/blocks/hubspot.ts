import { HubspotIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { HubspotResponse } from '@/tools/hubspot/types'

export const HubspotBlock: BlockConfig<HubspotResponse> = {
  type: 'hubspot',
  name: 'HubSpot',
  description: 'Manage contacts and deals in HubSpot CRM',
  longDescription:
    'Create, retrieve, list, and search contacts and create deals in HubSpot CRM. Authenticate with a HubSpot private app access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF7A59',
  icon: HubspotIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create contact', id: 'hubspot_create_contact' },
        { label: 'Get contact', id: 'hubspot_get_contact' },
        { label: 'List contacts', id: 'hubspot_list_contacts' },
        { label: 'Search contacts', id: 'hubspot_search_contacts' },
        { label: 'Create deal', id: 'hubspot_create_deal' },
      ],
      value: () => 'hubspot_create_contact',
    },
    // Create contact / create deal
    {
      id: 'properties',
      title: 'Properties (JSON)',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"email": "john@example.com", "firstname": "John", "lastname": "Doe"}',
      condition: {
        field: 'operation',
        value: ['hubspot_create_contact', 'hubspot_create_deal'],
      },
    },
    // Get contact
    {
      id: 'contactId',
      title: 'Contact ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '12345',
      condition: { field: 'operation', value: 'hubspot_get_contact' },
    },
    {
      id: 'properties',
      title: 'Properties (comma-separated)',
      type: 'short-input',
      layout: 'full',
      placeholder: 'email,firstname,lastname,phone',
      condition: {
        field: 'operation',
        value: ['hubspot_get_contact', 'hubspot_list_contacts'],
      },
    },
    // Search contacts
    {
      id: 'query',
      title: 'Search Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'john',
      condition: { field: 'operation', value: 'hubspot_search_contacts' },
    },
    {
      id: 'filterGroups',
      title: 'Filter Groups (JSON)',
      type: 'long-input',
      layout: 'full',
      placeholder:
        '[{"filters": [{"propertyName": "email", "operator": "EQ", "value": "john@example.com"}]}]',
      condition: { field: 'operation', value: 'hubspot_search_contacts' },
    },
    {
      id: 'properties',
      title: 'Properties (JSON array)',
      type: 'short-input',
      layout: 'full',
      placeholder: '["email","firstname","lastname"]',
      condition: { field: 'operation', value: 'hubspot_search_contacts' },
    },
    // List / search
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: {
        field: 'operation',
        value: ['hubspot_list_contacts', 'hubspot_search_contacts'],
      },
    },
    {
      id: 'after',
      title: 'After (pagination cursor)',
      type: 'short-input',
      layout: 'half',
      condition: { field: 'operation', value: 'hubspot_list_contacts' },
    },
    {
      id: 'apiKey',
      title: 'HubSpot Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'pat-na1-...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'hubspot_create_contact',
      'hubspot_get_contact',
      'hubspot_list_contacts',
      'hubspot_search_contacts',
      'hubspot_create_deal',
    ],
    config: {
      tool: (params) => params.operation || 'hubspot_create_contact',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'HubSpot private app access token' },
    properties: { type: 'json', description: 'Object properties or fields to return' },
    contactId: { type: 'string', description: 'Contact ID' },
    query: { type: 'string', description: 'Search query string' },
    filterGroups: { type: 'json', description: 'Search filter groups' },
    limit: { type: 'number', description: 'Result limit' },
    after: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from HubSpot' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
