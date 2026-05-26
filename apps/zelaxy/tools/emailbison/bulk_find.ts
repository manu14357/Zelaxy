import type { ToolConfig } from '@/tools/types'

export const emailbisonBulkFindTool: ToolConfig = {
  id: 'emailbison_bulk_find',
  name: 'EmailBison Bulk Find',
  description: 'Find email addresses for multiple people in a single request.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'EmailBison API key',
    },
    people: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Array of people as JSON (e.g., [{"first_name": "John", "last_name": "Doe", "domain": "example.com"}])',
    },
  },

  request: {
    url: 'https://api.emailbison.com/v1/email/bulk-find',
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      'X-API-Key': params.apiKey,
    }),
    body: (params) => ({ people: JSON.parse(params.people) }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data as { message?: string }).message || `HTTP ${response.status}`)
    }
    return {
      success: true,
      output: { results: data.results ?? [] },
    }
  },

  outputs: {
    results: { type: 'json', description: 'Array of email find results for each person' },
  },
}
