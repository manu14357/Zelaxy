import type { GoogleAdsListCampaignsParams, GoogleAdsResponse } from '@/tools/google_ads/types'
import type { ToolConfig } from '@/tools/types'

export const listCampaignsTool: ToolConfig<GoogleAdsListCampaignsParams, GoogleAdsResponse> = {
  id: 'google_ads_list_campaigns',
  name: 'Google Ads List Campaigns',
  description: 'List campaigns in a Google Ads account',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for the Google Ads API',
    },
    developerToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Ads API developer token',
    },
    customerId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Google Ads customer ID (numeric, no dashes)',
    },
    loginCustomerId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Manager account customer ID (if accessing via a manager account)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of campaigns to return',
    },
  },

  request: {
    url: (params) =>
      `https://googleads.googleapis.com/v17/customers/${params.customerId}/googleAds:search`,
    method: 'POST',
    headers: (params) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
        'developer-token': params.developerToken,
      }
      if (params.loginCustomerId) {
        headers['login-customer-id'] = params.loginCustomerId
      }
      return headers
    },
    body: (params) => {
      let query = 'SELECT campaign.id, campaign.name FROM campaign ORDER BY campaign.name'
      if (params.limit) {
        query += ` LIMIT ${params.limit}`
      }
      return { query }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data.results ?? []
    return {
      success: true,
      output: {
        data: results,
        metadata: { count: results.length, nextPageToken: data.nextPageToken ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of campaign result rows' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of campaigns returned' },
        nextPageToken: { type: 'string', description: 'Token for the next page of results' },
      },
    },
  },
}
