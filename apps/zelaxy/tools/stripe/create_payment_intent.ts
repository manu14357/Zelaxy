import type { CreatePaymentIntentParams, StripeObjectResponse } from '@/tools/stripe/types'
import type { ToolConfig } from '@/tools/types'

export const createPaymentIntentTool: ToolConfig<CreatePaymentIntentParams, StripeObjectResponse> =
  {
    id: 'stripe_create_payment_intent',
    name: 'Stripe Create Payment Intent',
    description: 'Create a Stripe PaymentIntent to collect a payment',
    version: '1.0.0',

    params: {
      apiKey: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'Stripe secret API key',
      },
      amount: {
        type: 'number',
        required: true,
        visibility: 'user-or-llm',
        description: 'Amount in the smallest currency unit (e.g. cents)',
      },
      currency: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'Three-letter ISO currency code (e.g. usd)',
      },
      customer: {
        type: 'string',
        required: false,
        visibility: 'user-or-llm',
        description: 'Customer ID to associate with the payment',
      },
      description: {
        type: 'string',
        required: false,
        visibility: 'user-or-llm',
        description: 'Description of the payment',
      },
      metadata: {
        type: 'json',
        required: false,
        visibility: 'user-or-llm',
        description: 'Set of key-value pairs to attach',
      },
    },

    request: {
      url: () => 'https://api.stripe.com/v1/payment_intents',
      method: 'POST',
      headers: (params) => ({
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
      body: (params) => {
        const form = new URLSearchParams()
        form.append('amount', String(params.amount))
        form.append('currency', params.currency)
        if (params.customer) form.append('customer', params.customer)
        if (params.description) form.append('description', params.description)
        if (params.metadata) {
          for (const [key, value] of Object.entries(params.metadata)) {
            form.append(`metadata[${key}]`, String(value))
          }
        }
        return { body: form.toString() }
      },
    },

    transformResponse: async (response) => {
      const data = await response.json()
      return {
        success: true,
        output: { data, metadata: { id: data.id, object: data.object } },
      }
    },

    outputs: {
      data: { type: 'json', description: 'The created PaymentIntent object' },
      metadata: {
        type: 'json',
        description: 'PaymentIntent identifiers',
        properties: {
          id: { type: 'string', description: 'PaymentIntent ID' },
          object: { type: 'string', description: 'Object type' },
        },
      },
    },
  }
