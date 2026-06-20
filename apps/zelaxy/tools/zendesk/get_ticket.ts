import type { ToolConfig } from '@/tools/types'
import type { ZendeskGetTicketParams, ZendeskObjectResponse } from '@/tools/zendesk/types'

export const getTicketTool: ToolConfig<ZendeskGetTicketParams, ZendeskObjectResponse> = {
  id: 'zendesk_get_ticket',
  name: 'Zendesk Get Ticket',
  description: 'Get a single ticket from Zendesk by ID',
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
      description: 'The ID of the ticket to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://${params.subdomain}.zendesk.com/api/v2/tickets/${params.ticketId}.json`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}/token:${params.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
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
    data: { type: 'json', description: 'The Zendesk ticket object' },
    metadata: {
      type: 'json',
      description: 'Ticket identifiers',
      properties: {
        id: { type: 'number', description: 'Ticket ID' },
      },
    },
  },
}
