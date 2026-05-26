import type { ToolConfig } from '@/tools/types'

export const enrichCompanyLookupTool: ToolConfig = {
  id: 'enrich_company_lookup',
  name: 'Enrich Company Lookup',
  description: 'Look up company information by name or domain.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrich API key',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name to look up',
    },
    domain: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company domain to look up (e.g., example.com)',
    },
  },

  request: {
    url: (params) => {
      const qs = new URLSearchParams()
      if (params.name) qs.set('name', params.name)
      if (params.domain) qs.set('domain', params.domain)
      return `https://api.enrich.so/v1/api/company?${qs.toString()}`
    },
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
        name: data.name ?? '',
        description: data.description ?? null,
        linkedInUrl: data.linkedInUrl ?? null,
        domain: data.domain ?? null,
        industry: data.industry ?? null,
        employeeCount: data.employeeCount ?? null,
      },
    }
  },

  outputs: {
    name: { type: 'string', description: 'Company name' },
    description: { type: 'string', description: 'Company description', optional: true },
    linkedInUrl: { type: 'string', description: 'LinkedIn company page URL', optional: true },
    domain: { type: 'string', description: 'Company domain', optional: true },
    industry: { type: 'string', description: 'Industry', optional: true },
    employeeCount: { type: 'number', description: 'Number of employees', optional: true },
  },
}
