import type { ToolConfig } from '@/tools/types'
import type { GetCreditsParams, ZeroBounceCreditsResponse } from '@/tools/zerobounce/types'

export const getCreditsTool: ToolConfig<GetCreditsParams, ZeroBounceCreditsResponse> = {
  id: 'zerobounce_get_credits',
  name: 'ZeroBounce Get Credits',
  description: 'Retrieve the remaining validation credits for the ZeroBounce account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ZeroBounce API key',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.zerobounce.net/v2/getcredits')
      url.searchParams.append('api_key', params.apiKey)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const credits = Number(data.Credits ?? 0)
    return {
      success: true,
      output: { data, metadata: { credits: Number.isNaN(credits) ? 0 : credits } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The ZeroBounce credits response object' },
    metadata: {
      type: 'json',
      description: 'Credit information',
      properties: {
        credits: { type: 'number', description: 'Remaining validation credits' },
      },
    },
  },
}
