import type { GetPaymentParams, SquareObjectResponse } from '@/tools/square/types'
import type { ToolConfig } from '@/tools/types'

export const getPaymentTool: ToolConfig<GetPaymentParams, SquareObjectResponse> = {
  id: 'square_get_payment',
  name: 'Square Get Payment',
  description: 'Retrieve details for a single Square payment by its ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Square access token',
    },
    payment_id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the payment to retrieve',
    },
  },

  request: {
    url: (params) => `https://connect.squareup.com/v2/payments/${params.payment_id}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Square-Version': '2024-01-18',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const payment = data.payment || {}
    return {
      success: true,
      output: {
        data: payment,
        metadata: { id: String(payment.id ?? '') },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Square payment object' },
    metadata: {
      type: 'json',
      description: 'Payment identifiers',
      properties: {
        id: { type: 'string', description: 'Payment ID' },
      },
    },
  },
}
