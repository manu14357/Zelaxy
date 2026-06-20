import type { ToolConfig } from '@/tools/types'
import type { ZendeskObjectResponse, ZendeskUpdateTicketParams } from '@/tools/zendesk/types'

export const updateTicketTool: ToolConfig<ZendeskUpdateTicketParams, ZendeskObjectResponse> = {
  id: 'zendesk_update_ticket',
  name: 'Zendesk Update Ticket',
  description: 'Update an existing ticket in Zendesk',
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
    ticketId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the ticket to update',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New status: "new", "open", "pending", "hold", "solved", or "closed"',
    },
  },

  request: {
    url: (params) =>
      `https://${params.subdomain}.zendesk.com/api/v2/tickets/${params.ticketId}.json`,
    method: 'PUT',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}/token:${params.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const ticket: Record<string, any> = {}
      if (params.status) ticket.status = params.status
      return { ticket }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data: data.ticket || data, metadata: { id: data.ticket?.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The updated Zendesk ticket object' },
    metadata: {
      type: 'json',
      description: 'Ticket identifiers',
      properties: {
        id: { type: 'number', description: 'Ticket ID' },
      },
    },
  },
}
