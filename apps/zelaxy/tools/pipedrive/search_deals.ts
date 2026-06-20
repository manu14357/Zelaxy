import type { PipedriveListResponse, SearchDealsParams } from '@/tools/pipedrive/types'
import type { ToolConfig } from '@/tools/types'

export const searchDealsTool: ToolConfig<SearchDealsParams, PipedriveListResponse> = {
  id: 'pipedrive_search_deals',
  name: 'Pipedrive Search Deals',
  description: 'Search for deals in Pipedrive by a search term',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Pipedrive API token',
    },
    term: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The search term to look for (min 2 characters)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (default 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.pipedrive.com/v1/deals/search')
      url.searchParams.append('api_token', params.apiKey)
      url.searchParams.append('term', params.term)
      if (params.limit !== undefined) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.data?.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: {
          count: items.length,
          has_more: data.additional_data?.pagination?.more_items_in_collection ?? false,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matching Pipedrive deal search results' },
    metadata: {
      type: 'json',
      description: 'Search result metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        has_more: { type: 'boolean', description: 'Whether more items exist beyond this page' },
      },
    },
  },
}
