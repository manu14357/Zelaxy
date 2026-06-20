import type { EmailFinderParams, LeadMagicObjectResponse } from '@/tools/leadmagic/types'
import type { ToolConfig } from '@/tools/types'

export const emailFinderTool: ToolConfig<EmailFinderParams, LeadMagicObjectResponse> = {
  id: 'leadmagic_email_finder',
  name: 'LeadMagic Email Finder',
  description: 'Find a verified work email from a name and company domain',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LeadMagic API key',
    },
    first_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Person's first name",
    },
    last_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "Person's last name",
    },
    domain: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company domain (e.g. stripe.com)',
    },
    company_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name (fallback if domain is unavailable)',
    },
  },

  request: {
    url: () => 'https://api.leadmagic.io/email-finder',
    method: 'POST',
    headers: (params) => ({
      'X-API-Key': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.first_name) body.first_name = params.first_name
      if (params.last_name) body.last_name = params.last_name
      if (params.domain) body.domain = params.domain
      if (params.company_name) body.company_name = params.company_name
      return body
    },
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
    data: { type: 'json', description: 'The found email and related data from LeadMagic' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        credits_consumed: { type: 'number', description: 'Credits charged for this request' },
      },
    },
  },
}
