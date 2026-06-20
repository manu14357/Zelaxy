import type { CreateProductParams, ShopifyObjectResponse } from '@/tools/shopify/types'
import type { ToolConfig } from '@/tools/types'

export const createProductTool: ToolConfig<CreateProductParams, ShopifyObjectResponse> = {
  id: 'shopify_create_product',
  name: 'Shopify Create Product',
  description: 'Create a new product in a Shopify store',
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
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Product title',
    },
    body_html: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Product description (HTML)',
    },
  },

  request: {
    url: (params) => `https://${params.storeDomain}/admin/api/2024-01/products.json`,
    method: 'POST',
    headers: (params) => ({
      'X-Shopify-Access-Token': params.apiKey,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const product: Record<string, any> = { title: params.title }
      if (params.body_html) product.body_html = params.body_html
      return { product }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const product = data.product || {}
    return {
      success: true,
      output: {
        data: product,
        metadata: { id: String(product.id ?? '') },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Shopify product object' },
    metadata: {
      type: 'json',
      description: 'Product identifiers',
      properties: {
        id: { type: 'string', description: 'Product ID' },
      },
    },
  },
}
