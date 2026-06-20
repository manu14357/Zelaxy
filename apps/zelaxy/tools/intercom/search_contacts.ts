import type { IntercomListResponse, SearchContactsParams } from '@/tools/intercom/types'
import type { ToolConfig } from '@/tools/types'

export const searchContactsTool: ToolConfig<SearchContactsParams, IntercomListResponse> = {
  id: 'intercom_search_contacts',
  name: 'Intercom Search Contacts',
  description: 'Search for contacts in Intercom using a single field query',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Intercom API access token',
    },
    field: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The contact field to search on (e.g. email, name)',
    },
    operator: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The comparison operator (e.g. =, ~, !=, >, <)',
    },
    value: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The value to match against',
    },
  },

  request: {
    url: () => 'https://api.intercom.io/contacts/search',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    }),
    body: (params) => ({
      query: {
        field: params.field,
        operator: params.operator,
        value: params.value,
      },
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
    data: { type: 'json', description: 'Array of matching Intercom contact objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        total_count: { type: 'number', description: 'Total number of matching contacts' },
      },
    },
  },
}
