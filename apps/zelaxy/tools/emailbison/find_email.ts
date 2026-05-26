import type { ToolConfig } from '@/tools/types'

export const emailbisonFindEmailTool: ToolConfig = {
  id: 'emailbison_find_email',
  name: 'EmailBison Find Email',
  description: 'Find the email address of a person by their name and company domain.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'EmailBison API key',
    },
    firstName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'First name of the person',
    },
    lastName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Last name of the person',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company domain (e.g., example.com)',
    },
  },

  request: {
    url: (params) =>
      `https://api.emailbison.com/v1/email/find?first_name=${encodeURIComponent(params.firstName)}&last_name=${encodeURIComponent(params.lastName)}&domain=${encodeURIComponent(params.domain)}`,
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
        score: data.score ?? null,
        status: data.status ?? '',
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        domain: data.domain ?? '',
      },
    }
  },

  outputs: {
    email: { type: 'string', description: 'Found email address' },
    score: { type: 'number', description: 'Confidence score', optional: true },
    status: { type: 'string', description: 'Email status' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    domain: { type: 'string', description: 'Company domain' },
  },
}
