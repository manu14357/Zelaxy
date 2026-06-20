import type { RipplingListCompaniesParams, RipplingListResponse } from '@/tools/rippling/types'
import type { ToolConfig } from '@/tools/types'

export const listCompaniesTool: ToolConfig<RipplingListCompaniesParams, RipplingListResponse> = {
  id: 'rippling_list_companies',
  name: 'Rippling List Companies',
  description: 'List companies in Rippling with optional pagination',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Rippling API key',
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
      if (params.expand) query.set('expand', params.expand)
      if (params.orderBy) query.set('order_by', params.orderBy)
      if (params.cursor) query.set('cursor', params.cursor)
      const qs = query.toString()
      return `https://rest.ripplingapis.com/companies/${qs ? `?${qs}` : ''}`
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
    data: { type: 'json', description: 'Array of Rippling company objects' },
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
