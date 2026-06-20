import type { LemlistListCampaignsParams, LemlistListResponse } from '@/tools/lemlist/types'
import type { ToolConfig } from '@/tools/types'

export const listCampaignsTool: ToolConfig<LemlistListCampaignsParams, LemlistListResponse> = {
  id: 'lemlist_list_campaigns',
  name: 'Lemlist List Campaigns',
  description: 'List campaigns in your Lemlist account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Lemlist API key',
    },
  },

  request: {
    url: () => 'https://api.lemlist.com/api/campaigns',
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const campaigns = Array.isArray(data) ? data : data.campaigns || []
    return {
      success: true,
      output: { data: campaigns, metadata: { count: campaigns.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Lemlist campaign objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of campaigns returned' },
      },
    },
  },
}
