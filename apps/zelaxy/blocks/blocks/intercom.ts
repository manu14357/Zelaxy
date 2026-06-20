import { IntercomIcon } from '@/components/icons/intercom-icon'
import type { BlockConfig } from '@/blocks/types'
import type { IntercomResponse } from '@/tools/intercom/types'

export const IntercomBlock: BlockConfig<IntercomResponse> = {
  type: 'intercom',
  name: 'Intercom',
  description: 'Manage contacts in Intercom',
  longDescription:
    'Create, list, get, and search contacts through the Intercom API. Authenticate with an Intercom access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1F8DED',
  icon: IntercomIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create contact', id: 'intercom_create_contact' },
        { label: 'List contacts', id: 'intercom_list_contacts' },
        { label: 'Get contact', id: 'intercom_get_contact' },
        { label: 'Search contacts', id: 'intercom_search_contacts' },
      ],
      value: () => 'intercom_create_contact',
    },
    // Create contact
    {
      id: 'role',
      title: 'Role',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user or lead',
      condition: { field: 'operation', value: 'intercom_create_contact' },
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'contact@example.com',
      condition: { field: 'operation', value: 'intercom_create_contact' },
    },
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane Doe',
      condition: { field: 'operation', value: 'intercom_create_contact' },
    },
    {
      id: 'phone',
      title: 'Phone',
      type: 'short-input',
      layout: 'half',
      placeholder: '+15551234567',
      condition: { field: 'operation', value: 'intercom_create_contact' },
    },
    // Get contact
    {
      id: 'id',
      title: 'Contact ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '5ba682d23d7cf92bef87bfd4',
      condition: { field: 'operation', value: 'intercom_get_contact' },
    },
    // Search contacts
    {
      id: 'field',
      title: 'Field',
      type: 'short-input',
      layout: 'half',
      placeholder: 'email',
      condition: { field: 'operation', value: 'intercom_search_contacts' },
    },
    {
      id: 'operator',
      title: 'Operator',
      type: 'short-input',
      layout: 'half',
      placeholder: '=',
      condition: { field: 'operation', value: 'intercom_search_contacts' },
    },
    {
      id: 'value',
      title: 'Value',
      type: 'short-input',
      layout: 'full',
      placeholder: 'user@example.com',
      condition: { field: 'operation', value: 'intercom_search_contacts' },
    },
    // List contacts
    {
      id: 'per_page',
      title: 'Per Page',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: { field: 'operation', value: 'intercom_list_contacts' },
    },
    {
      id: 'starting_after',
      title: 'Starting After',
      type: 'short-input',
      layout: 'half',
      condition: { field: 'operation', value: 'intercom_list_contacts' },
    },
    {
      id: 'apiKey',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Intercom access token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'intercom_create_contact',
      'intercom_list_contacts',
      'intercom_get_contact',
      'intercom_search_contacts',
    ],
    config: {
      tool: (params) => params.operation || 'intercom_create_contact',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Intercom access token' },
    role: { type: 'string', description: 'Contact role (user or lead)' },
    email: { type: 'string', description: 'Contact email' },
    name: { type: 'string', description: 'Contact name' },
    phone: { type: 'string', description: 'Contact phone' },
    id: { type: 'string', description: 'Contact ID' },
    field: { type: 'string', description: 'Search field' },
    operator: { type: 'string', description: 'Search operator' },
    value: { type: 'string', description: 'Search value' },
    per_page: { type: 'number', description: 'Results per page' },
    starting_after: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Intercom' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
