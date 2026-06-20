import type { ToolConfig } from '@/tools/types'
import type { ZendeskListResponse, ZendeskListTicketsParams } from '@/tools/zendesk/types'

export const listTicketsTool: ToolConfig<ZendeskListTicketsParams, ZendeskListResponse> = {
  id: 'zendesk_list_tickets',
  name: 'Zendesk List Tickets',
  description: 'List tickets in Zendesk',
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
  },

  request: {
    url: (params) => `https://${params.subdomain}.zendesk.com/api/v2/tickets.json`,
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
      output: {
        data: data.tickets || [],
        metadata: { count: (data.tickets || []).length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Zendesk ticket objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of tickets returned' },
      },
    },
  },
}
