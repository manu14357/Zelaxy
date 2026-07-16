import { RevenueCatIcon } from '@/components/icons/revenuecat-icon'
import type { BlockConfig } from '@/blocks/types'
import type { RevenueCatResponse } from '@/tools/revenuecat/types'

export const RevenueCatBlock: BlockConfig<RevenueCatResponse> = {
  type: 'revenuecat',
  name: 'RevenueCat',
  description: 'Manage customers and subscriptions in RevenueCat',
  longDescription:
    'Retrieve customers, list customers, and fetch customer subscriptions through the RevenueCat v2 API. Authenticate with a RevenueCat v2 secret key and project ID.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F25A5A',
  icon: RevenueCatIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get customer', id: 'revenuecat_get_customer' },
        { label: 'List customers', id: 'revenuecat_list_customers' },
        { label: 'Get subscription', id: 'revenuecat_get_subscription' },
      ],
      value: () => 'revenuecat_get_customer',
    },
    // Get customer / Get subscription
    {
      id: 'customerId',
      title: 'Customer ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'app_user_id',
      condition: {
        field: 'operation',
        value: ['revenuecat_get_customer', 'revenuecat_get_subscription'],
      },
    },
    // List customers
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: 'revenuecat_list_customers' },
    },
    {
      id: 'startingAfter',
      title: 'Starting After',
      type: 'short-input',
      layout: 'half',
      placeholder: 'cursor',
      condition: { field: 'operation', value: 'revenuecat_list_customers' },
    },
    // Auth / connection
    {
      id: 'projectId',
      title: 'Project ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'projXXXXXXXX',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'RevenueCat Secret Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'sk_...',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'revenuecat',
      availableTriggers: ['revenuecat_webhook'],
    },
  ],
  tools: {
    access: ['revenuecat_get_customer', 'revenuecat_list_customers', 'revenuecat_get_subscription'],
    config: {
      tool: (params) => params.operation || 'revenuecat_get_customer',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'RevenueCat v2 secret API key' },
    projectId: { type: 'string', description: 'RevenueCat project ID' },
    customerId: { type: 'string', description: 'Customer (app user) ID' },
    limit: { type: 'number', description: 'Result limit' },
    startingAfter: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from RevenueCat' },
    metadata: { type: 'json', description: 'Response metadata' },
    event_type: { type: 'string', description: 'RevenueCat event type (trigger events)' },
    app_user_id: { type: 'string', description: 'App user ID' },
    product_id: { type: 'string', description: 'Product identifier' },
    store: { type: 'string', description: 'Store' },
  },
  triggers: {
    enabled: true,
    available: ['revenuecat_webhook'],
  },
}
