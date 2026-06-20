import type { ListCustomersParams, RevenueCatListResponse } from '@/tools/revenuecat/types'
import type { ToolConfig } from '@/tools/types'

export const listCustomersTool: ToolConfig<ListCustomersParams, RevenueCatListResponse> = {
  id: 'revenuecat_list_customers',
  name: 'RevenueCat List Customers',
  description: 'List customers within a RevenueCat project',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'RevenueCat v2 secret API key (sk_...)',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'RevenueCat project ID',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (default 20, max 100)',
    },
    startingAfter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Cursor for pagination (customer ID to start after)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.revenuecat.com/v2/projects/${encodeURIComponent(params.projectId)}/customers`
      )
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      if (params.startingAfter) url.searchParams.append('starting_after', params.startingAfter)
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
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, next_page: data.next_page ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of RevenueCat customer objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        next_page: { type: 'string', description: 'URL or cursor for the next page, if any' },
      },
    },
  },
}
