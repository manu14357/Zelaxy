import { ZendeskIcon } from '@/components/icons/zendesk-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ZendeskResponse } from '@/tools/zendesk/types'

export const ZendeskBlock: BlockConfig<ZendeskResponse> = {
  type: 'zendesk',
  name: 'Zendesk',
  description: 'Manage support tickets in Zendesk',
  longDescription:
    'Create, list, retrieve, update, and search support tickets through the Zendesk API. Authenticate with your subdomain, account email, and an API token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#03363D',
  icon: ZendeskIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create ticket', id: 'zendesk_create_ticket' },
        { label: 'List tickets', id: 'zendesk_list_tickets' },
        { label: 'Get ticket', id: 'zendesk_get_ticket' },
        { label: 'Update ticket', id: 'zendesk_update_ticket' },
        { label: 'Search', id: 'zendesk_search' },
      ],
      value: () => 'zendesk_create_ticket',
    },
    // Create ticket
    {
      id: 'subject',
      title: 'Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Cannot log in',
      condition: { field: 'operation', value: 'zendesk_create_ticket' },
    },
    {
      id: 'body',
      title: 'Body',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Describe the issue...',
      condition: { field: 'operation', value: 'zendesk_create_ticket' },
    },
    // Get / Update ticket
    {
      id: 'ticketId',
      title: 'Ticket ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '12345',
      condition: {
        field: 'operation',
        value: ['zendesk_get_ticket', 'zendesk_update_ticket'],
      },
    },
    // Update ticket
    {
      id: 'status',
      title: 'Status',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'New', id: 'new' },
        { label: 'Open', id: 'open' },
        { label: 'Pending', id: 'pending' },
        { label: 'Hold', id: 'hold' },
        { label: 'Solved', id: 'solved' },
        { label: 'Closed', id: 'closed' },
      ],
      value: () => 'open',
      condition: { field: 'operation', value: 'zendesk_update_ticket' },
    },
    // Search
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'type:ticket status:open',
      condition: { field: 'operation', value: 'zendesk_search' },
    },
    // Auth
    {
      id: 'subdomain',
      title: 'Subdomain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'acme',
      password: true,
      required: true,
    },
    {
      id: 'email',
      title: 'Account Email',
      type: 'short-input',
      layout: 'full',
      placeholder: 'agent@acme.com',
      password: true,
      required: true,
    },
    {
      id: 'apiToken',
      title: 'API Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Zendesk API token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'zendesk_create_ticket',
      'zendesk_list_tickets',
      'zendesk_get_ticket',
      'zendesk_update_ticket',
      'zendesk_search',
    ],
    config: {
      tool: (params) => params.operation || 'zendesk_create_ticket',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    subdomain: { type: 'string', description: 'Zendesk subdomain' },
    email: { type: 'string', description: 'Zendesk account email' },
    apiToken: { type: 'string', description: 'Zendesk API token' },
    subject: { type: 'string', description: 'Ticket subject' },
    body: { type: 'string', description: 'Ticket body' },
    ticketId: { type: 'string', description: 'Ticket ID' },
    status: { type: 'string', description: 'Ticket status' },
    query: { type: 'string', description: 'Search query' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Zendesk' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
