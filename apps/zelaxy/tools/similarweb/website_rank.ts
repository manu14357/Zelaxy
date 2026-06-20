import type { SimilarwebObjectResponse, WebsiteRankParams } from '@/tools/similarweb/types'
import type { ToolConfig } from '@/tools/types'

export const websiteRankTool: ToolConfig<WebsiteRankParams, SimilarwebObjectResponse> = {
  id: 'similarweb_website_rank',
  name: 'SimilarWeb Website Rank',
  description: 'Get the global rank of a website from SimilarWeb',
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
        `https://api.similarweb.com/v1/website/${params.domain}/global-rank/global-rank`
      )
      url.searchParams.append('api_key', params.apiKey)
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
    data: { type: 'json', description: 'The SimilarWeb global rank response object' },
    metadata: {
      type: 'json',
      description: 'Request identifiers',
      properties: {
        domain: { type: 'string', description: 'The analyzed domain' },
      },
    },
  },
}
