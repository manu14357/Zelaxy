import type { ToolConfig } from '@/tools/types'
import type { VantaListResponse, VantaListTestsParams } from '@/tools/vanta/types'

export const listTestsTool: ToolConfig<VantaListTestsParams, VantaListResponse> = {
  id: 'vanta_list_tests',
  name: 'Vanta List Tests',
  description: 'List automated compliance tests in Vanta, with optional filters',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Vanta API access token',
    },
    statusFilter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Filter by test status: OK, DEACTIVATED, NEEDS_ATTENTION, IN_PROGRESS, INVALID, or NOT_APPLICABLE',
    },
    frameworkFilter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by framework ID (e.g., soc2)',
    },
    integrationFilter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by integration ID (e.g., aws)',
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
      const url = new URL('https://api.vanta.com/v1/tests')
      if (params.statusFilter) url.searchParams.set('statusFilter', params.statusFilter)
      if (params.frameworkFilter) url.searchParams.set('frameworkFilter', params.frameworkFilter)
      if (params.integrationFilter)
        url.searchParams.set('integrationFilter', params.integrationFilter)
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
    data: { type: 'json', description: 'Array of Vanta test objects' },
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
