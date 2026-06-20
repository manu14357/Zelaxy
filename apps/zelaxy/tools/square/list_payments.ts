import type { ListPaymentsParams, SquareListResponse } from '@/tools/square/types'
import type { ToolConfig } from '@/tools/types'

export const listPaymentsTool: ToolConfig<ListPaymentsParams, SquareListResponse> = {
  id: 'square_list_payments',
  name: 'Square List Payments',
  description: 'List payments taken by a Square account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Square access token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of payments to return per page',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://connect.squareup.com/v2/payments')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Square-Version': '2024-01-18',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const payments = data.payments || []
    return {
      success: true,
      output: {
        data: payments,
        metadata: { count: payments.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Square payment objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
