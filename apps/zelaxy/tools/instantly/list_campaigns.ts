import type { InstantlyListResponse, ListCampaignsParams } from '@/tools/instantly/types'
import type { ToolConfig } from '@/tools/types'

export const listCampaignsTool: ToolConfig<ListCampaignsParams, InstantlyListResponse> = {
  id: 'instantly_list_campaigns',
  name: 'Instantly List Campaigns',
  description: 'List campaigns in Instantly',
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
    url: () => 'https://api.instantly.ai/api/v2/campaigns',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
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
    data: { type: 'json', description: 'Array of Instantly campaign objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of campaigns returned' },
      },
    },
  },
}
