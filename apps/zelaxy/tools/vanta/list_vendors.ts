import type { ToolConfig } from '@/tools/types'
import type { VantaListResponse, VantaListVendorsParams } from '@/tools/vanta/types'

export const listVendorsTool: ToolConfig<VantaListVendorsParams, VantaListResponse> = {
  id: 'vanta_list_vendors',
  name: 'Vanta List Vendors',
  description: 'List vendors tracked in Vanta with risk levels and review schedules',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Vanta API access token',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter vendors by name',
    },
    statusMatchesAny: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Comma-separated vendor statuses to filter by: MANAGED, ARCHIVED, IN_PROCUREMENT',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of items per page (1-100, default 10)',
    },
    pageCursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.vanta.com/v1/vendors')
      if (params.name) url.searchParams.set('name', params.name)
      if (params.statusMatchesAny) {
        for (const entry of params.statusMatchesAny.split(',')) {
          const trimmed = entry.trim()
          if (trimmed) url.searchParams.append('statusMatchesAny', trimmed)
        }
      }
      if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize))
      if (params.pageCursor) url.searchParams.set('pageCursor', params.pageCursor)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const results = data.results?.data ?? []
    return {
      success: true,
      output: {
        data: results,
        metadata: { count: results.length, pageInfo: data.results?.pageInfo ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Vanta vendor objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        pageInfo: { type: 'json', description: 'Cursor pagination info' },
      },
    },
  },
}
