import type { ToolConfig } from '@/tools/types'
import type { ValidateEmailParams, ZeroBounceObjectResponse } from '@/tools/zerobounce/types'

export const validateEmailTool: ToolConfig<ValidateEmailParams, ZeroBounceObjectResponse> = {
  id: 'zerobounce_validate_email',
  name: 'ZeroBounce Validate Email',
  description: 'Validate an email address deliverability in real time using ZeroBounce',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ZeroBounce API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to validate',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.zerobounce.net/v2/validate')
      url.searchParams.append('api_key', params.apiKey)
      url.searchParams.append('email', params.email)
      return url.toString()
    },
    method: 'GET',
    headers: () => ({ Accept: 'application/json' }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { email: data.address, status: data.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The ZeroBounce validation result object' },
    metadata: {
      type: 'json',
      description: 'Validation identifiers',
      properties: {
        email: { type: 'string', description: 'The validated email address' },
        status: { type: 'string', description: 'Validation status' },
      },
    },
  },
}
