import type { ProspeoMobileFinderParams, ProspeoObjectResponse } from '@/tools/prospeo/types'
import type { ToolConfig } from '@/tools/types'

export const mobileFinderTool: ToolConfig<ProspeoMobileFinderParams, ProspeoObjectResponse> = {
  id: 'prospeo_mobile_finder',
  name: 'Prospeo Mobile Finder',
  description: 'Find a mobile phone number from a LinkedIn profile URL',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Prospeo API key',
    },
    url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL to resolve a mobile number for',
    },
  },

  request: {
    url: () => 'https://api.prospeo.io/mobile-finder',
    method: 'POST',
    headers: (params) => ({
      'X-KEY': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      url: params.url,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data: data.response ?? data, metadata: { error: data.error ?? false } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The matched mobile record from Prospeo' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        error: { type: 'boolean', description: 'Whether the API reported an error' },
      },
    },
  },
}
