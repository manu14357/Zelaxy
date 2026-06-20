import type { GoogleAdsResponse, GoogleAdsSearchParams } from '@/tools/google_ads/types'
import type { ToolConfig } from '@/tools/types'

export const searchTool: ToolConfig<GoogleAdsSearchParams, GoogleAdsResponse> = {
  id: 'google_ads_search',
  name: 'Google Ads Search',
  description: 'Run a Google Ads Query Language (GAQL) query against a customer account',
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
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'GAQL query to execute',
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
    body: (params) => ({ query: params.query }),
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
    data: { type: 'json', description: 'Array of result rows from the GAQL query' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        count: { type: 'number', description: 'Number of result rows returned' },
        nextPageToken: { type: 'string', description: 'Token for the next page of results' },
      },
    },
  },
}
