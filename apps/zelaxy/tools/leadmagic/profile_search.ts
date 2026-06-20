import type { LeadMagicObjectResponse, ProfileSearchParams } from '@/tools/leadmagic/types'
import type { ToolConfig } from '@/tools/types'

export const profileSearchTool: ToolConfig<ProfileSearchParams, LeadMagicObjectResponse> = {
  id: 'leadmagic_profile_search',
  name: 'LeadMagic Profile Search',
  description: 'Enrich a LinkedIn profile with work history, education, and contact data',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LeadMagic API key',
    },
    profile_url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL or username',
    },
  },

  request: {
    url: () => 'https://api.leadmagic.io/profile-search',
    method: 'POST',
    headers: (params) => ({
      'X-API-Key': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ profile_url: params.profile_url }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { credits_consumed: data.credits_consumed ?? 0 },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The enriched profile data from LeadMagic' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        credits_consumed: { type: 'number', description: 'Credits charged for this request' },
      },
    },
  },
}
