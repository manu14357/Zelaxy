import type { GetCustomerParams, RevenueCatObjectResponse } from '@/tools/revenuecat/types'
import type { ToolConfig } from '@/tools/types'

export const getCustomerTool: ToolConfig<GetCustomerParams, RevenueCatObjectResponse> = {
  id: 'revenuecat_get_customer',
  name: 'RevenueCat Get Customer',
  description: 'Retrieve a RevenueCat customer by ID within a project',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'RevenueCat v2 secret API key (sk_...)',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'RevenueCat project ID',
    },
    customerId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The customer (app user) ID',
    },
  },

  request: {
    url: (params) =>
      `https://api.revenuecat.com/v2/projects/${encodeURIComponent(params.projectId)}/customers/${encodeURIComponent(params.customerId)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id, object: data.object } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The RevenueCat customer object' },
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
