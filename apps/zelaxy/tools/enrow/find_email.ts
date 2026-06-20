import type { EnrowObjectResponse, FindEmailParams } from '@/tools/enrow/types'
import type { ToolConfig } from '@/tools/types'

export const findEmailTool: ToolConfig<FindEmailParams, EnrowObjectResponse> = {
  id: 'enrow_find_email',
  name: 'Enrow Find Email',
  description: 'Find a B2B email address from a full name and company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrow API key',
    },
    fullname: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Full name of the person (e.g. "John Doe")',
    },
    company: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company name or domain (e.g. "Apple" or "apple.com")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.enrow.io/email/find/single')
      url.searchParams.append('fullname', params.fullname)
      url.searchParams.append('company', params.company)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'x-api-key': params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The find-email job response' },
    metadata: {
      type: 'json',
      description: 'Job identifiers',
      properties: {
        id: { type: 'string', description: 'Job ID to poll with Get Result' },
      },
    },
  },
}
