import type { ToolConfig } from '@/tools/types'

export const enrichEmailToProfileTool: ToolConfig = {
  id: 'enrich_email_to_profile',
  name: 'Enrich Email to Profile',
  description: 'Get a full person profile from an email address using Enrich.',
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
      description: 'Email address to look up',
    },
  },

  request: {
    url: (params) =>
      `https://api.enrich.so/v1/api/person?email=${encodeURIComponent(params.email)}`,
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
        displayName: data.displayName ?? '',
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        linkedInUrl: data.linkedInUrl ?? null,
        jobTitle: data.jobTitle ?? null,
        companyName: data.companyName ?? null,
      },
    }
  },

  outputs: {
    displayName: { type: 'string', description: 'Full display name' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    email: { type: 'string', description: 'Email address' },
    linkedInUrl: { type: 'string', description: 'LinkedIn profile URL', optional: true },
    jobTitle: { type: 'string', description: 'Current job title', optional: true },
    companyName: { type: 'string', description: 'Current company name', optional: true },
  },
}
