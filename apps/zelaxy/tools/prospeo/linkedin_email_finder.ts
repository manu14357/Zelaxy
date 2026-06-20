import type { ProspeoLinkedinEmailFinderParams, ProspeoObjectResponse } from '@/tools/prospeo/types'
import type { ToolConfig } from '@/tools/types'

export const linkedinEmailFinderTool: ToolConfig<
  ProspeoLinkedinEmailFinderParams,
  ProspeoObjectResponse
> = {
  id: 'prospeo_linkedin_email_finder',
  name: 'Prospeo LinkedIn Email Finder',
  description: 'Find a verified professional email address from a LinkedIn profile URL',
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
      description: 'LinkedIn profile URL to resolve an email for',
    },
  },

  request: {
    url: () => 'https://api.prospeo.io/linkedin-email-finder',
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
    data: { type: 'json', description: 'The matched email record from Prospeo' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        error: { type: 'boolean', description: 'Whether the API reported an error' },
      },
    },
  },
}
