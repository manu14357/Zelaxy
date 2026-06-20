import type { IntercomListResponse, ListContactsParams } from '@/tools/intercom/types'
import type { ToolConfig } from '@/tools/types'

export const listContactsTool: ToolConfig<ListContactsParams, IntercomListResponse> = {
  id: 'intercom_list_contacts',
  name: 'Intercom List Contacts',
  description: 'List all contacts from Intercom with pagination support',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Intercom API access token',
    },
    per_page: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max 150)',
    },
    starting_after: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Cursor for pagination - ID to start after',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.intercom.io/contacts')
      if (params.per_page) url.searchParams.append('per_page', String(params.per_page))
      if (params.starting_after) url.searchParams.append('starting_after', params.starting_after)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.data || [],
        metadata: {
          count: (data.data || []).length,
          total_count: data.total_count,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Intercom contact objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        total_count: { type: 'number', description: 'Total number of contacts' },
      },
    },
  },
}
