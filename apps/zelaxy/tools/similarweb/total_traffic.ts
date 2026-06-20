import type { SimilarwebObjectResponse, TotalTrafficParams } from '@/tools/similarweb/types'
import type { ToolConfig } from '@/tools/types'

export const totalTrafficTool: ToolConfig<TotalTrafficParams, SimilarwebObjectResponse> = {
  id: 'similarweb_total_traffic',
  name: 'SimilarWeb Total Traffic',
  description: 'Get total website visits and engagement over time from SimilarWeb',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SimilarWeb API key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Website domain to analyze (e.g., example.com)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.similarweb.com/v1/website/${params.domain}/total-traffic-and-engagement/visits`
      )
      url.searchParams.append('api_key', params.apiKey)
      url.searchParams.append('granularity', 'monthly')
      url.searchParams.append('main_domain_only', 'false')
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { domain: params?.domain ?? '' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The SimilarWeb total traffic response object' },
    metadata: {
      type: 'json',
      description: 'Request identifiers',
      properties: {
        domain: { type: 'string', description: 'The analyzed domain' },
      },
    },
  },
}
