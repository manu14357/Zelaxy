import type { ListContactsParams, SendgridListResponse } from '@/tools/sendgrid/types'
import type { ToolConfig } from '@/tools/types'

export const listContactsTool: ToolConfig<ListContactsParams, SendgridListResponse> = {
  id: 'sendgrid_list_contacts',
  name: 'SendGrid List Contacts',
  description: 'List marketing contacts in SendGrid',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SendGrid API key',
    },
  },

  request: {
    url: () => 'https://api.sendgrid.com/v3/marketing/contacts',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const result = data.result || []
    return {
      success: true,
      output: {
        data: result,
        metadata: { count: result.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of SendGrid contact objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of contacts returned' },
      },
    },
  },
}
