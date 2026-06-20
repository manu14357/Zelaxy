import type { DatagmaObjectResponse, FindEmailParams } from '@/tools/datagma/types'
import type { ToolConfig } from '@/tools/types'

export const findEmailTool: ToolConfig<FindEmailParams, DatagmaObjectResponse> = {
  id: 'datagma_find_email',
  name: 'Datagma Find Email',
  description: 'Find a verified work email from a name and company',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Datagma API key',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Person's first name",
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Person's last name",
    },
    company: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name or domain',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://gateway.datagma.net/api/ingress/findEmail')
      url.searchParams.set('apiId', params.apiKey)
      if (params.firstName) url.searchParams.set('firstName', params.firstName)
      if (params.lastName) url.searchParams.set('lastName', params.lastName)
      if (params.company) url.searchParams.set('company', params.company)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { found: Boolean(data?.email) },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The found email and related data from Datagma' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        found: { type: 'boolean', description: 'Whether a verified email was found' },
      },
    },
  },
}
