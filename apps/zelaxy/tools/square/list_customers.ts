import type { ListCustomersParams, SquareListResponse } from '@/tools/square/types'
import type { ToolConfig } from '@/tools/types'

export const listCustomersTool: ToolConfig<ListCustomersParams, SquareListResponse> = {
  id: 'square_list_customers',
  name: 'Square List Customers',
  description: 'List customers from the Square customer directory',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Square access token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of customers to return per page',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://connect.squareup.com/v2/customers')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Square-Version': '2024-01-18',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const customers = data.customers || []
    return {
      success: true,
      output: {
        data: customers,
        metadata: { count: customers.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Square customer objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
