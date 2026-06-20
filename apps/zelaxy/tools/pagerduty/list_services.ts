import type { ListServicesParams, PagerDutyListResponse } from '@/tools/pagerduty/types'
import type { ToolConfig } from '@/tools/types'

export const listServicesTool: ToolConfig<ListServicesParams, PagerDutyListResponse> = {
  id: 'pagerduty_list_services',
  name: 'PagerDuty List Services',
  description: 'List services from PagerDuty',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PagerDuty REST API key',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.pagerduty.com/services')
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Token token=${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.services || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, more: data.more || false },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of service objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of services returned' },
        more: { type: 'boolean', description: 'Whether more services exist beyond this page' },
      },
    },
  },
}
