import type { GetSubscriptionParams, RevenueCatListResponse } from '@/tools/revenuecat/types'
import type { ToolConfig } from '@/tools/types'

export const getSubscriptionTool: ToolConfig<GetSubscriptionParams, RevenueCatListResponse> = {
  id: 'revenuecat_get_subscription',
  name: 'RevenueCat Get Subscription',
  description: 'List subscriptions for a RevenueCat customer within a project',
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
      `https://api.revenuecat.com/v2/projects/${encodeURIComponent(params.projectId)}/customers/${encodeURIComponent(params.customerId)}/subscriptions`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, next_page: data.next_page ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of RevenueCat subscription objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        next_page: { type: 'string', description: 'URL or cursor for the next page, if any' },
      },
    },
  },
}
