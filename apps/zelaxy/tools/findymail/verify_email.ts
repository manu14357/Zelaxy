import type { FindymailObjectResponse, VerifyEmailParams } from '@/tools/findymail/types'
import type { ToolConfig } from '@/tools/types'

export const verifyEmailTool: ToolConfig<VerifyEmailParams, FindymailObjectResponse> = {
  id: 'findymail_verify_email',
  name: 'Findymail Verify Email',
  description: 'Verify the deliverability of an email address',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Findymail API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to verify (e.g. john@example.com)',
    },
  },

  request: {
    url: () => 'https://app.findymail.com/api/verify',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ email: params.email }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { email: data.email ?? null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The verification response' },
    metadata: {
      type: 'json',
      description: 'Result identifiers',
      properties: {
        email: { type: 'string', description: 'The verified email address' },
      },
    },
  },
}
