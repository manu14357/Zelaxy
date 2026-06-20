import { StripeIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { StripeResponse } from '@/tools/stripe/types'

export const StripeBlock: BlockConfig<StripeResponse> = {
  type: 'stripe',
  name: 'Stripe',
  description: 'Manage customers, payments, and refunds in Stripe',
  longDescription:
    'Create and list customers, create payment intents, list charges, and issue refunds through the Stripe API. Authenticate with a Stripe secret key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#635BFF',
  icon: StripeIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create customer', id: 'stripe_create_customer' },
        { label: 'List customers', id: 'stripe_list_customers' },
        { label: 'Create payment intent', id: 'stripe_create_payment_intent' },
        { label: 'List charges', id: 'stripe_list_charges' },
        { label: 'Create refund', id: 'stripe_create_refund' },
      ],
      value: () => 'stripe_create_customer',
    },
    // Create customer
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'customer@example.com',
      condition: { field: 'operation', value: ['stripe_create_customer', 'stripe_list_customers'] },
    },
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Jane Doe',
      condition: { field: 'operation', value: 'stripe_create_customer' },
    },
    {
      id: 'phone',
      title: 'Phone',
      type: 'short-input',
      layout: 'half',
      placeholder: '+15551234567',
      condition: { field: 'operation', value: 'stripe_create_customer' },
    },
    {
      id: 'description',
      title: 'Description',
      type: 'short-input',
      layout: 'full',
      condition: {
        field: 'operation',
        value: ['stripe_create_customer', 'stripe_create_payment_intent'],
      },
    },
    // Payment intent
    {
      id: 'amount',
      title: 'Amount (smallest unit, e.g. cents)',
      type: 'short-input',
      layout: 'half',
      placeholder: '2000',
      condition: {
        field: 'operation',
        value: ['stripe_create_payment_intent', 'stripe_create_refund'],
      },
    },
    {
      id: 'currency',
      title: 'Currency',
      type: 'short-input',
      layout: 'half',
      placeholder: 'usd',
      condition: { field: 'operation', value: 'stripe_create_payment_intent' },
    },
    {
      id: 'customer',
      title: 'Customer ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'cus_...',
      condition: {
        field: 'operation',
        value: ['stripe_create_payment_intent', 'stripe_list_charges'],
      },
    },
    // Refund
    {
      id: 'payment_intent',
      title: 'Payment Intent ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'pi_...',
      condition: { field: 'operation', value: 'stripe_create_refund' },
    },
    {
      id: 'charge',
      title: 'Charge ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'ch_...',
      condition: { field: 'operation', value: 'stripe_create_refund' },
    },
    {
      id: 'reason',
      title: 'Refund Reason',
      type: 'short-input',
      layout: 'half',
      placeholder: 'requested_by_customer',
      condition: { field: 'operation', value: 'stripe_create_refund' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: {
        field: 'operation',
        value: ['stripe_list_customers', 'stripe_list_charges'],
      },
    },
    {
      id: 'apiKey',
      title: 'Stripe Secret Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'sk_live_... or sk_test_...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'stripe_create_customer',
      'stripe_list_customers',
      'stripe_create_payment_intent',
      'stripe_list_charges',
      'stripe_create_refund',
    ],
    config: {
      tool: (params) => params.operation || 'stripe_create_customer',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Stripe secret API key' },
    email: { type: 'string', description: 'Customer email' },
    name: { type: 'string', description: 'Customer name' },
    phone: { type: 'string', description: 'Customer phone' },
    description: { type: 'string', description: 'Description' },
    amount: { type: 'number', description: 'Amount in smallest currency unit' },
    currency: { type: 'string', description: 'ISO currency code' },
    customer: { type: 'string', description: 'Customer ID' },
    payment_intent: { type: 'string', description: 'PaymentIntent ID' },
    charge: { type: 'string', description: 'Charge ID' },
    reason: { type: 'string', description: 'Refund reason' },
    metadata: { type: 'json', description: 'Key-value metadata' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Stripe' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
