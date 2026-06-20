import type {
  MillionVerifierObjectResponse,
  VerifyEmailParams,
} from '@/tools/millionverifier/types'
import type { ToolConfig } from '@/tools/types'

export const verifyEmailTool: ToolConfig<VerifyEmailParams, MillionVerifierObjectResponse> = {
  id: 'millionverifier_verify_email',
  name: 'MillionVerifier Verify Email',
  description: 'Verify the deliverability of an email address using MillionVerifier',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'MillionVerifier API key',
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
      const url = new URL('https://api.millionverifier.com/api/v3/')
      url.searchParams.append('api', params.apiKey)
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
    data: { type: 'json', description: 'The MillionVerifier verification result object' },
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
