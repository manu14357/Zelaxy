import type { PeopleDataLabsObjectResponse, PersonEnrichParams } from '@/tools/peopledatalabs/types'
import type { ToolConfig } from '@/tools/types'

export const personEnrichTool: ToolConfig<PersonEnrichParams, PeopleDataLabsObjectResponse> = {
  id: 'peopledatalabs_person_enrich',
  name: 'People Data Labs Person Enrich',
  description: 'Enrich a single person profile by email, name, or company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'People Data Labs API key',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address to match',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Full name (use with company)',
    },
    company: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name or website',
    },
    min_likelihood: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Minimum match likelihood (1-10)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.peopledatalabs.com/v5/person/enrich')
      if (params.email) url.searchParams.append('email', params.email)
      if (params.name) url.searchParams.append('name', params.name)
      if (params.company) url.searchParams.append('company', params.company)
      if (params.min_likelihood)
        url.searchParams.append('min_likelihood', String(params.min_likelihood))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'X-Api-Key': params.apiKey,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.data || {},
        metadata: { status: data.status ?? response.status, likelihood: data.likelihood },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The matched person record' },
    metadata: {
      type: 'json',
      description: 'Match metadata',
      properties: {
        status: { type: 'number', description: 'API status code' },
        likelihood: { type: 'number', description: 'Match likelihood score (1-10)' },
      },
    },
  },
}
