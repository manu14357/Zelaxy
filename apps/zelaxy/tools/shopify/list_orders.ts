import type { ListOrdersParams, ShopifyListResponse } from '@/tools/shopify/types'
import type { ToolConfig } from '@/tools/types'

export const listOrdersTool: ToolConfig<ListOrdersParams, ShopifyListResponse> = {
  id: 'shopify_list_orders',
  name: 'Shopify List Orders',
  description: 'List orders from a Shopify store',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Shopify Admin API access token',
    },
    storeDomain: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Shopify store domain (e.g. mystore.myshopify.com)',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Order status filter (open, closed, cancelled, any). Defaults to any',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of orders to return (default 50, max 250)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://${params.storeDomain}/admin/api/2024-01/orders.json`)
      url.searchParams.append('status', params.status || 'any')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'X-Shopify-Access-Token': params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const orders = data.orders || []
    return {
      success: true,
      output: {
        data: orders,
        metadata: { count: orders.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Shopify order objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
