import type { ListIncidentsParams, RootlyListResponse } from '@/tools/rootly/types'
import type { ToolConfig } from '@/tools/types'

export const listIncidentsTool: ToolConfig<ListIncidentsParams, RootlyListResponse> = {
  id: 'rootly_list_incidents',
  name: 'Rootly List Incidents',
  description: 'List incidents from Rootly',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Rootly API key',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return per page',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.rootly.com/v1/incidents')
      if (params.pageSize) url.searchParams.append('page[size]', String(params.pageSize))
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
    const items = data.data || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, total: data.meta?.total_count },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of incident objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of incidents returned' },
        total: { type: 'number', description: 'Total number of incidents available' },
      },
    },
  },
}
