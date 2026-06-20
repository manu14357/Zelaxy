import type { ListDealsParams, PipedriveListResponse } from '@/tools/pipedrive/types'
import type { ToolConfig } from '@/tools/types'

export const listDealsTool: ToolConfig<ListDealsParams, PipedriveListResponse> = {
  id: 'pipedrive_list_deals',
  name: 'Pipedrive List Deals',
  description: 'List deals from Pipedrive, optionally filtered by status',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Pipedrive API token',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter deals by status: open, won, lost, deleted, all_not_deleted',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (default 100)',
    },
    start: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination start offset',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.pipedrive.com/v1/deals')
      url.searchParams.append('api_token', params.apiKey)
      if (params.status) url.searchParams.append('status', params.status)
      if (params.limit !== undefined) url.searchParams.append('limit', String(params.limit))
      if (params.start !== undefined) url.searchParams.append('start', String(params.start))
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const deals = data.data || []
    return {
      success: true,
      output: {
        data: deals,
        metadata: {
          count: deals.length,
          has_more: data.additional_data?.pagination?.more_items_in_collection ?? false,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Pipedrive deal objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        has_more: { type: 'boolean', description: 'Whether more items exist beyond this page' },
      },
    },
  },
}
