import type { InstantlyListResponse, ListLeadsParams } from '@/tools/instantly/types'
import type { ToolConfig } from '@/tools/types'

export const listLeadsTool: ToolConfig<ListLeadsParams, InstantlyListResponse> = {
  id: 'instantly_list_leads',
  name: 'Instantly List Leads',
  description: 'List leads in Instantly',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Instantly API key',
    },
  },

  request: {
    url: () => 'https://api.instantly.ai/api/v2/leads/list',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: () => ({}),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items || data.data || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Instantly lead objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of leads returned' },
      },
    },
  },
}
