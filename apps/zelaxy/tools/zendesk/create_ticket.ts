import type { ToolConfig } from '@/tools/types'
import type { ZendeskCreateTicketParams, ZendeskObjectResponse } from '@/tools/zendesk/types'

export const createTicketTool: ToolConfig<ZendeskCreateTicketParams, ZendeskObjectResponse> = {
  id: 'zendesk_create_ticket',
  name: 'Zendesk Create Ticket',
  description: 'Create a new ticket in Zendesk',
  version: '1.0.0',

  params: {
    subdomain: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zendesk subdomain (e.g. "acme" for acme.zendesk.com)',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zendesk account email address',
    },
    apiToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Zendesk API token',
    },
    subject: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Ticket subject',
    },
    body: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Ticket comment body (first comment)',
    },
  },

  request: {
    url: (params) => `https://${params.subdomain}.zendesk.com/api/v2/tickets.json`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}/token:${params.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      ticket: { subject: params.subject, comment: { body: params.body } },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data: data.ticket || data, metadata: { id: data.ticket?.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Zendesk ticket object' },
    metadata: {
      type: 'json',
      description: 'Ticket identifiers',
      properties: {
        id: { type: 'number', description: 'Ticket ID' },
      },
    },
  },
}
