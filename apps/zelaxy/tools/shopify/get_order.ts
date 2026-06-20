import type { GetOrderParams, ShopifyObjectResponse } from '@/tools/shopify/types'
import type { ToolConfig } from '@/tools/types'

export const getOrderTool: ToolConfig<GetOrderParams, ShopifyObjectResponse> = {
  id: 'shopify_get_order',
  name: 'Shopify Get Order',
  description: 'Get a single order by ID from a Shopify store',
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
    orderId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the order to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://${params.storeDomain}/admin/api/2024-01/orders/${params.orderId}.json`,
    method: 'GET',
    headers: (params) => ({
      'X-Shopify-Access-Token': params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const order = data.order || {}
    return {
      success: true,
      output: {
        data: order,
        metadata: { id: String(order.id ?? '') },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Shopify order object' },
    metadata: {
      type: 'json',
      description: 'Order identifiers',
      properties: {
        id: { type: 'string', description: 'Order ID' },
      },
    },
  },
}
