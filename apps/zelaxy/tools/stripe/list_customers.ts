import type { ListParams, StripeListResponse } from '@/tools/stripe/types'
import type { ToolConfig } from '@/tools/types'

export const listCustomersTool: ToolConfig<ListParams, StripeListResponse> = {
  id: 'stripe_list_customers',
  name: 'Stripe List Customers',
  description: 'List Stripe customers, optionally filtered by email',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Stripe secret API key',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter customers by exact email',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (default 10, max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.stripe.com/v1/customers')
      if (params.email) url.searchParams.append('email', params.email)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.data || [],
        metadata: { count: (data.data || []).length, has_more: data.has_more || false },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Stripe customer objects' },
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
