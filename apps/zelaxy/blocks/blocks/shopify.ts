import { ShopifyIcon } from '@/components/icons/shopify-icon'
import type { BlockConfig } from '@/blocks/types'
import type { ShopifyResponse } from '@/tools/shopify/types'

export const ShopifyBlock: BlockConfig<ShopifyResponse> = {
  type: 'shopify',
  name: 'Shopify',
  description: 'Manage products and orders in Shopify',
  longDescription:
    'List and create products, and list and retrieve orders from your Shopify store through the Shopify Admin API. Authenticate with an Admin API access token and your store domain.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#95BF47',
  icon: ShopifyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List products', id: 'shopify_list_products' },
        { label: 'Create product', id: 'shopify_create_product' },
        { label: 'List orders', id: 'shopify_list_orders' },
        { label: 'Get order', id: 'shopify_get_order' },
      ],
      value: () => 'shopify_list_products',
    },
    // Create product
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My Product',
      condition: { field: 'operation', value: 'shopify_create_product' },
    },
    {
      id: 'body_html',
      title: 'Description (HTML)',
      type: 'long-input',
      layout: 'full',
      placeholder: '<p>Product description</p>',
      condition: { field: 'operation', value: 'shopify_create_product' },
    },
    // Get order
    {
      id: 'orderId',
      title: 'Order ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '450789469',
      condition: { field: 'operation', value: 'shopify_get_order' },
    },
    // List orders
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'any',
      condition: { field: 'operation', value: 'shopify_list_orders' },
    },
    // List products / orders
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: {
        field: 'operation',
        value: ['shopify_list_products', 'shopify_list_orders'],
      },
    },
    {
      id: 'storeDomain',
      title: 'Store Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'mystore.myshopify.com',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Admin API Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'shpat_...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'shopify_list_products',
      'shopify_create_product',
      'shopify_list_orders',
      'shopify_get_order',
    ],
    config: {
      tool: (params) => params.operation || 'shopify_list_products',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Shopify Admin API access token' },
    storeDomain: { type: 'string', description: 'Shopify store domain' },
    title: { type: 'string', description: 'Product title' },
    body_html: { type: 'string', description: 'Product description (HTML)' },
    orderId: { type: 'string', description: 'Order ID' },
    status: { type: 'string', description: 'Order status filter' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Shopify' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
