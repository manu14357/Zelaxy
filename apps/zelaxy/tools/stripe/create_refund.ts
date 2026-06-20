import type { CreateRefundParams, StripeObjectResponse } from '@/tools/stripe/types'
import type { ToolConfig } from '@/tools/types'

export const createRefundTool: ToolConfig<CreateRefundParams, StripeObjectResponse> = {
  id: 'stripe_create_refund',
  name: 'Stripe Create Refund',
  description: 'Refund a charge or payment intent',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Stripe secret API key',
    },
    payment_intent: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'PaymentIntent ID to refund',
    },
    charge: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Charge ID to refund (use this or payment_intent)',
    },
    amount: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Amount to refund in the smallest currency unit (defaults to full)',
    },
    reason: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Reason: duplicate, fraudulent, or requested_by_customer',
    },
  },

  request: {
    url: () => 'https://api.stripe.com/v1/refunds',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: (params) => {
      const form = new URLSearchParams()
      if (params.payment_intent) form.append('payment_intent', params.payment_intent)
      if (params.charge) form.append('charge', params.charge)
      if (params.amount != null) form.append('amount', String(params.amount))
      if (params.reason) form.append('reason', params.reason)
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
    data: { type: 'json', description: 'The created refund object' },
    metadata: {
      type: 'json',
      description: 'Refund identifiers',
      properties: {
        id: { type: 'string', description: 'Refund ID' },
        object: { type: 'string', description: 'Object type' },
      },
    },
  },
}
