import type { RipplingListResponse, RipplingListWorkersParams } from '@/tools/rippling/types'
import type { ToolConfig } from '@/tools/types'

export const listWorkersTool: ToolConfig<RipplingListWorkersParams, RipplingListResponse> = {
  id: 'rippling_list_workers',
  name: 'Rippling List Workers',
  description: 'List workers (employees) in Rippling with optional filtering and pagination',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Rippling API key',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter expression to narrow the returned workers',
    },
    expand: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated fields to expand',
    },
    orderBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field. Prefix with - for descending',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
  },

  request: {
    url: (params) => {
      const query = new URLSearchParams()
      if (params.filter) query.set('filter', params.filter)
      if (params.expand) query.set('expand', params.expand)
      if (params.orderBy) query.set('order_by', params.orderBy)
      if (params.cursor) query.set('cursor', params.cursor)
      const qs = query.toString()
      return `https://rest.ripplingapis.com/workers/${qs ? `?${qs}` : ''}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data.results ?? []
    return {
      success: true,
      output: {
        data: results,
        metadata: { count: results.length, next_link: data.next_link ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Rippling worker objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        next_link: { type: 'string', description: 'Link to the next page of results' },
      },
    },
  },
}
