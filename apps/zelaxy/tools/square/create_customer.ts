import type { CreateCustomerParams, SquareObjectResponse } from '@/tools/square/types'
import type { ToolConfig } from '@/tools/types'

export const createCustomerTool: ToolConfig<CreateCustomerParams, SquareObjectResponse> = {
  id: 'square_create_customer',
  name: 'Square Create Customer',
  description: 'Create a new customer in the Square customer directory',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Square access token',
    },
    given_name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'First name of the customer',
    },
    email_address: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address of the customer',
    },
  },

  request: {
    url: () => 'https://connect.squareup.com/v2/customers',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Square-Version': '2024-01-18',
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.given_name) body.given_name = params.given_name
      if (params.email_address) body.email_address = params.email_address
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const customer = data.customer || {}
    return {
      success: true,
      output: {
        data: customer,
        metadata: { id: String(customer.id ?? '') },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Square customer object' },
    metadata: {
      type: 'json',
      description: 'Customer identifiers',
      properties: {
        id: { type: 'string', description: 'Customer ID' },
      },
    },
  },
}
