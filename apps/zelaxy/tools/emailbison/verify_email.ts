import type { ToolConfig } from '@/tools/types'

export const emailbisonVerifyEmailTool: ToolConfig = {
  id: 'emailbison_verify_email',
  name: 'EmailBison Verify Email',
  description: 'Verify whether an email address is valid and deliverable.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'EmailBison API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to verify',
    },
  },

  request: {
    url: (params) =>
      `https://api.emailbison.com/v1/email/verify?email=${encodeURIComponent(params.email)}`,
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'X-API-Key': params.apiKey,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || `HTTP ${response.status}`)
    }
    return {
      success: true,
      output: {
        email: data.email ?? '',
        status: data.status ?? '',
        isValid: data.is_valid ?? false,
        score: data.score ?? null,
      },
    }
  },

  outputs: {
    email: { type: 'string', description: 'The verified email address' },
    status: { type: 'string', description: 'Verification status' },
    isValid: { type: 'boolean', description: 'Whether the email is valid' },
    score: { type: 'number', description: 'Confidence score', optional: true },
  },
}
