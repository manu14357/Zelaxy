import type { ToolConfig } from '@/tools/types'

export const enrichFindEmailTool: ToolConfig = {
  id: 'enrich_find_email',
  name: 'Enrich Find Email',
  description: 'Find the email address of a person by their full name and company domain.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrich API key',
    },
    fullName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Full name of the person',
    },
    companyDomain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company domain (e.g., example.com)',
    },
  },

  request: {
    url: (params) =>
      `https://api.enrich.so/v1/api/find-email?fullName=${encodeURIComponent(params.fullName)}&companyDomain=${encodeURIComponent(params.companyDomain)}`,
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
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        domain: data.domain ?? '',
        found: data.found ?? false,
        acceptAll: data.acceptAll ?? false,
      },
    }
  },

  outputs: {
    email: { type: 'string', description: 'Found email address' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    domain: { type: 'string', description: 'Company domain' },
    found: { type: 'boolean', description: 'Whether an email was found' },
    acceptAll: { type: 'boolean', description: 'Whether the domain accepts all emails' },
  },
}
