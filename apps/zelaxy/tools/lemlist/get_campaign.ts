import type { LemlistGetCampaignParams, LemlistObjectResponse } from '@/tools/lemlist/types'
import type { ToolConfig } from '@/tools/types'

export const getCampaignTool: ToolConfig<LemlistGetCampaignParams, LemlistObjectResponse> = {
  id: 'lemlist_get_campaign',
  name: 'Lemlist Get Campaign',
  description: 'Get a single Lemlist campaign by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Lemlist API key',
    },
    campaignId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the campaign to retrieve',
    },
  },

  request: {
    url: (params) => `https://api.lemlist.com/api/campaigns/${params.campaignId}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`:${params.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data._id || data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Lemlist campaign object' },
    metadata: {
      type: 'json',
      description: 'Campaign identifiers',
      properties: {
        id: { type: 'string', description: 'Campaign ID' },
      },
    },
  },
}
