import type {
  GetCreditsParams,
  MillionVerifierCreditsResponse,
} from '@/tools/millionverifier/types'
import type { ToolConfig } from '@/tools/types'

export const getCreditsTool: ToolConfig<GetCreditsParams, MillionVerifierCreditsResponse> = {
  id: 'millionverifier_get_credits',
  name: 'MillionVerifier Get Credits',
  description: 'Retrieve the remaining verification credits for the MillionVerifier account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'MillionVerifier API key',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.millionverifier.com/api/v3/credits')
      url.searchParams.append('api', params.apiKey)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const credits = Number(typeof data === 'number' ? data : (data.credits ?? 0))
    return {
      success: true,
      output: { data, metadata: { credits: Number.isNaN(credits) ? 0 : credits } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The MillionVerifier credits response object' },
    metadata: {
      type: 'json',
      description: 'Credit information',
      properties: {
        credits: { type: 'number', description: 'Remaining verification credits' },
      },
    },
  },
}
