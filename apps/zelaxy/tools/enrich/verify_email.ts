import type { ToolConfig } from '@/tools/types'

export const enrichVerifyEmailTool: ToolConfig = {
  id: 'enrich_verify_email',
  name: 'Enrich Verify Email',
  description: 'Verify the deliverability and validity of an email address.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrich API key',
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
      `https://api.enrich.so/v1/api/verify-email?email=${encodeURIComponent(params.email)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
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
        result: data.result ?? '',
        confidenceScore: data.confidenceScore ?? null,
        isValid: data.isValid ?? false,
      },
    }
  },

  outputs: {
    email: { type: 'string', description: 'The verified email address' },
    status: { type: 'string', description: 'Verification status' },
    result: { type: 'string', description: 'Verification result' },
    confidenceScore: { type: 'number', description: 'Confidence score', optional: true },
    isValid: { type: 'boolean', description: 'Whether the email is valid' },
  },
}
