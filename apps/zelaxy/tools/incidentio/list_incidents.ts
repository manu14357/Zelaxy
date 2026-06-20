import type { IncidentioListResponse, ListIncidentsParams } from '@/tools/incidentio/types'
import type { ToolConfig } from '@/tools/types'

export const listIncidentsTool: ToolConfig<ListIncidentsParams, IncidentioListResponse> = {
  id: 'incidentio_list_incidents',
  name: 'incident.io List Incidents',
  description: 'List incidents from incident.io',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'incident.io API key',
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
      const url = new URL('https://api.incident.io/v2/incidents')
      if (params.pageSize) url.searchParams.append('page_size', String(params.pageSize))
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
    const items = data.incidents || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, after: data.pagination_meta?.after },
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
        after: { type: 'string', description: 'Cursor for the next page' },
      },
    },
  },
}
