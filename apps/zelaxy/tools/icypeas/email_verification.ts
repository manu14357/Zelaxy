import type { EmailVerificationParams, IcypeasObjectResponse } from '@/tools/icypeas/types'
import type { ToolConfig } from '@/tools/types'

export const emailVerificationTool: ToolConfig<EmailVerificationParams, IcypeasObjectResponse> = {
  id: 'icypeas_email_verification',
  name: 'Icypeas Email Verification',
  description: 'Verify whether an email address is valid and deliverable',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Icypeas API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to verify (e.g. john@stripe.com)',
    },
  },

  request: {
    url: () => 'https://app.icypeas.com/api/email-verification',
    method: 'POST',
    headers: (params) => ({
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ email: params.email }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { searchId: data.item?._id ?? null, status: data.item?.status ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The email-verification submission response' },
    metadata: {
      type: 'json',
      description: 'Verification identifiers',
      properties: {
        searchId: { type: 'string', description: 'Icypeas internal search ID' },
        status: { type: 'string', description: 'Verification status' },
      },
    },
  },
}
