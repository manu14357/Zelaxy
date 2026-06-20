import type { NeverBounceObjectResponse, VerifyEmailParams } from '@/tools/neverbounce/types'
import type { ToolConfig } from '@/tools/types'

export const verifyEmailTool: ToolConfig<VerifyEmailParams, NeverBounceObjectResponse> = {
  id: 'neverbounce_verify_email',
  name: 'NeverBounce Verify Email',
  description: 'Verify the deliverability of an email address using NeverBounce',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'NeverBounce API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to verify',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.neverbounce.com/v4/single/check')
      url.searchParams.append('key', params.apiKey)
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
      output: { data, metadata: { email: data.email, result: data.result } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The NeverBounce verification result object' },
    metadata: {
      type: 'json',
      description: 'Verification identifiers',
      properties: {
        email: { type: 'string', description: 'The verified email address' },
        result: { type: 'string', description: 'Verification result' },
      },
    },
  },
}
