import type { ListIncidentsParams, PagerDutyListResponse } from '@/tools/pagerduty/types'
import type { ToolConfig } from '@/tools/types'

export const listIncidentsTool: ToolConfig<ListIncidentsParams, PagerDutyListResponse> = {
  id: 'pagerduty_list_incidents',
  name: 'PagerDuty List Incidents',
  description: 'List incidents from PagerDuty',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PagerDuty REST API key',
    },
    statuses: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated statuses to filter by (e.g. triggered,acknowledged)',
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
      const url = new URL('https://api.pagerduty.com/incidents')
      if (params.statuses) {
        for (const status of params.statuses.split(',')) {
          url.searchParams.append('statuses[]', status.trim())
        }
      }
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
    const items = data.incidents || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, more: data.more || false },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of incident objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of incidents returned' },
        more: { type: 'boolean', description: 'Whether more incidents exist beyond this page' },
      },
    },
  },
}
