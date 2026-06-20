import type { EnrowObjectResponse, VerifyEmailParams } from '@/tools/enrow/types'
import type { ToolConfig } from '@/tools/types'

export const verifyEmailTool: ToolConfig<VerifyEmailParams, EnrowObjectResponse> = {
  id: 'enrow_verify_email',
  name: 'Enrow Verify Email',
  description: 'Verify the deliverability of an email address',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrow API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to verify (e.g. "john@example.com")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.enrow.io/email/verify/single')
      url.searchParams.append('email', params.email)
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
    data: { type: 'json', description: 'The verify-email job response' },
    metadata: {
      type: 'json',
      description: 'Job identifiers',
      properties: {
        id: { type: 'string', description: 'Job ID to poll with Get Result' },
      },
    },
  },
}
