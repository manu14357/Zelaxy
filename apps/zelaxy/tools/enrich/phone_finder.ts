import type { ToolConfig } from '@/tools/types'

export const enrichPhoneFinderTool: ToolConfig = {
  id: 'enrich_phone_finder',
  name: 'Enrich Phone Finder',
  description: 'Find the mobile phone number for a person from their LinkedIn profile URL.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Enrich API key',
    },
    linkedinProfile: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL (e.g., https://linkedin.com/in/johndoe)',
    },
  },

  request: {
    url: (params) =>
      `https://api.enrich.so/v1/api/mobile-finder?linkedin_profile=${encodeURIComponent(params.linkedinProfile)}`,
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
        profileUrl: data.profileUrl ?? '',
        mobileNumber: data.mobileNumber ?? null,
        found: data.found ?? false,
        status: data.status ?? '',
      },
    }
  },

  outputs: {
    profileUrl: { type: 'string', description: 'LinkedIn profile URL' },
    mobileNumber: { type: 'string', description: 'Mobile phone number', optional: true },
    found: { type: 'boolean', description: 'Whether a phone number was found' },
    status: { type: 'string', description: 'Lookup status' },
  },
}
