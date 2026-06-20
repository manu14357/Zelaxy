import type { CreateCustomerParams, StripeObjectResponse } from '@/tools/stripe/types'
import type { ToolConfig } from '@/tools/types'

export const createCustomerTool: ToolConfig<CreateCustomerParams, StripeObjectResponse> = {
  id: 'stripe_create_customer',
  name: 'Stripe Create Customer',
  description: 'Create a new Stripe customer',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Stripe secret API key',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Customer email address',
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Customer full name',
    },
    phone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Customer phone number',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Description of the customer',
    },
    metadata: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Set of key-value pairs to attach to the customer',
    },
  },

  request: {
    url: () => 'https://api.stripe.com/v1/customers',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: (params) => {
      const form = new URLSearchParams()
      if (params.email) form.append('email', params.email)
      if (params.name) form.append('name', params.name)
      if (params.phone) form.append('phone', params.phone)
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
    data: { type: 'json', description: 'The created Stripe customer object' },
    metadata: {
      type: 'json',
      description: 'Customer identifiers',
      properties: {
        id: { type: 'string', description: 'Customer ID' },
        object: { type: 'string', description: 'Object type' },
      },
    },
  },
}
