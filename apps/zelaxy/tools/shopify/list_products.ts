import type { ListProductsParams, ShopifyListResponse } from '@/tools/shopify/types'
import type { ToolConfig } from '@/tools/types'

export const listProductsTool: ToolConfig<ListProductsParams, ShopifyListResponse> = {
  id: 'shopify_list_products',
  name: 'Shopify List Products',
  description: 'List products from a Shopify store',
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
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of products to return (default 50, max 250)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://${params.storeDomain}/admin/api/2024-01/products.json`)
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
    const products = data.products || []
    return {
      success: true,
      output: {
        data: products,
        metadata: { count: products.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Shopify product objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
