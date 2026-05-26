import type { ToolConfig } from '@/tools/types'

export const emailbisonDomainSearchTool: ToolConfig = {
  id: 'emailbison_domain_search',
  name: 'EmailBison Domain Search',
  description: 'Search for email addresses associated with a company domain.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'EmailBison API key',
    },
    domain: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company domain to search (e.g., example.com)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of emails to return',
    },
  },

  request: {
    url: (params) =>
      `https://api.emailbison.com/v1/email/domain-search?domain=${encodeURIComponent(params.domain)}${params.limit ? `&limit=${params.limit}` : ''}`,
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
        emails: data.emails ?? [],
        domain: data.domain ?? '',
        total: data.total ?? 0,
      },
    }
  },

  outputs: {
    emails: { type: 'json', description: 'Array of email addresses found for the domain' },
    domain: { type: 'string', description: 'The domain searched' },
    total: { type: 'number', description: 'Total number of emails found' },
  },
}
