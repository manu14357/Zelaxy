import type { ToolConfig } from '@/tools/types'
import type { VantaListControlsParams, VantaListResponse } from '@/tools/vanta/types'

export const listControlsTool: ToolConfig<VantaListControlsParams, VantaListResponse> = {
  id: 'vanta_list_controls',
  name: 'Vanta List Controls',
  description: 'List security controls in Vanta, optionally filtered by framework',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Vanta API access token',
    },
    frameworkMatchesAny: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated framework IDs to filter controls by (e.g., soc2,iso27001)',
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
      const url = new URL('https://api.vanta.com/v1/controls')
      if (params.frameworkMatchesAny) {
        for (const entry of params.frameworkMatchesAny.split(',')) {
          const trimmed = entry.trim()
          if (trimmed) url.searchParams.append('frameworkMatchesAny', trimmed)
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
    data: { type: 'json', description: 'Array of Vanta control objects' },
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
