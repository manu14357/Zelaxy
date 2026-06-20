import type { Rb2bListResponse, Rb2bListVisitorsParams } from '@/tools/rb2b/types'
import type { ToolConfig } from '@/tools/types'

export const listVisitorsTool: ToolConfig<Rb2bListVisitorsParams, Rb2bListResponse> = {
  id: 'rb2b_list_visitors',
  name: 'RB2B List Visitors',
  description: 'List website visitors identified by RB2B',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'RB2B API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of visitors to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.rb2b.com/visitors')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const visitors = Array.isArray(data) ? data : (data.visitors ?? data.data ?? [])
    return {
      success: true,
      output: {
        data: visitors,
        metadata: { count: visitors.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of identified visitor objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of visitors returned' },
      },
    },
  },
}
