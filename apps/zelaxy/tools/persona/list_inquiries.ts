import type { PersonaListInquiriesParams, PersonaListResponse } from '@/tools/persona/types'
import type { ToolConfig } from '@/tools/types'

export const listInquiriesTool: ToolConfig<PersonaListInquiriesParams, PersonaListResponse> = {
  id: 'persona_list_inquiries',
  name: 'Persona List Inquiries',
  description: 'List Persona identity verification inquiries',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Persona API key',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by inquiry status (e.g. completed, pending, failed)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of inquiries to return per page (1-100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.withpersona.com/api/v1/inquiries')
      if (params.status) url.searchParams.append('filter[status]', params.status)
      if (params.limit) url.searchParams.append('page[size]', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Persona-Version': '2023-01-05',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const inquiries = data.data ?? []
    return {
      success: true,
      output: {
        data: inquiries,
        metadata: { count: inquiries.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Persona inquiry objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of inquiries returned' },
      },
    },
  },
}
