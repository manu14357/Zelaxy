import { SquareIcon } from '@/components/icons/square-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SquareResponse } from '@/tools/square/types'

export const SquareBlock: BlockConfig<SquareResponse> = {
  type: 'square',
  name: 'Square',
  description: 'Manage customers and payments in Square',
  longDescription:
    'List and create customers, and list and retrieve payments through the Square API. Authenticate with a Square access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#000000',
  icon: SquareIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List customers', id: 'square_list_customers' },
        { label: 'Create customer', id: 'square_create_customer' },
        { label: 'List payments', id: 'square_list_payments' },
        { label: 'Get payment', id: 'square_get_payment' },
      ],
      value: () => 'square_list_customers',
    },
    // Create customer
    {
      id: 'given_name',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane',
      condition: { field: 'operation', value: 'square_create_customer' },
    },
    {
      id: 'email_address',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'customer@example.com',
      condition: { field: 'operation', value: 'square_create_customer' },
    },
    // Get payment
    {
      id: 'payment_id',
      title: 'Payment ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'bP9mUVN...',
      condition: { field: 'operation', value: 'square_get_payment' },
    },
    // List customers / payments
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: {
        field: 'operation',
        value: ['square_list_customers', 'square_list_payments'],
      },
    },
    {
      id: 'apiKey',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'EAAA...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'square_list_customers',
      'square_create_customer',
      'square_list_payments',
      'square_get_payment',
    ],
    config: {
      tool: (params) => params.operation || 'square_list_customers',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Square access token' },
    given_name: { type: 'string', description: 'Customer first name' },
    email_address: { type: 'string', description: 'Customer email' },
    payment_id: { type: 'string', description: 'Payment ID' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Square' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
