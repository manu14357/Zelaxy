import type { ProspeoEmailFinderParams, ProspeoObjectResponse } from '@/tools/prospeo/types'
import type { ToolConfig } from '@/tools/types'

export const emailFinderTool: ToolConfig<ProspeoEmailFinderParams, ProspeoObjectResponse> = {
  id: 'prospeo_email_finder',
  name: 'Prospeo Email Finder',
  description: 'Find a verified professional email address from a name and company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Prospeo API key',
    },
    first_name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Person's first name",
    },
    last_name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: "Person's last name",
    },
    company: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company name or domain',
    },
  },

  request: {
    url: () => 'https://api.prospeo.io/email-finder',
    method: 'POST',
    headers: (params) => ({
      'X-KEY': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      first_name: params.first_name,
      last_name: params.last_name,
      company: params.company,
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
