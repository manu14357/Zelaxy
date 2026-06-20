import type { EmailValidateParams, LeadMagicObjectResponse } from '@/tools/leadmagic/types'
import type { ToolConfig } from '@/tools/types'

export const emailValidateTool: ToolConfig<EmailValidateParams, LeadMagicObjectResponse> = {
  id: 'leadmagic_email_validate',
  name: 'LeadMagic Email Validate',
  description: 'Verify an email address for deliverability',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LeadMagic API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Email address to validate',
    },
  },

  request: {
    url: () => 'https://api.leadmagic.io/email-validate',
    method: 'POST',
    headers: (params) => ({
      'X-API-Key': params.apiKey,
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
        metadata: { credits_consumed: data.credits_consumed ?? 0 },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The validation result from LeadMagic' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        credits_consumed: { type: 'number', description: 'Credits charged for this request' },
      },
    },
  },
}
