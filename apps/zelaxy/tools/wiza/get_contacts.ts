import type { ToolConfig } from '@/tools/types'
import type { WizaGetContactsParams, WizaListResponse } from '@/tools/wiza/types'

export const getContactsTool: ToolConfig<WizaGetContactsParams, WizaListResponse> = {
  id: 'wiza_get_contacts',
  name: 'Wiza Get Contacts',
  description: 'Retrieve the revealed contacts for a Wiza list',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Wiza API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The list ID to fetch contacts for',
    },
  },

  request: {
    url: (params) => `https://wiza.co/api/lists/${encodeURIComponent(params.id)}/contacts`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const contacts = Array.isArray(data) ? data : (data.data ?? [])
    return {
      success: true,
      output: {
        data: contacts,
        metadata: { count: contacts.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of revealed contact objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of contacts returned' },
      },
    },
  },
}
