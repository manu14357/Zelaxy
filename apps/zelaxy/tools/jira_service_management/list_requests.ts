import type {
  JiraSmListRequestsParams,
  JiraSmListResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const listRequestsTool: ToolConfig<JiraSmListRequestsParams, JiraSmListResponse> = {
  id: 'jira_service_management_list_requests',
  name: 'Jira Service Management List Requests',
  description: 'List customer requests, optionally scoped to a service desk',
  version: '1.0.0',

  params: {
    siteUrl: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Atlassian site URL (e.g. https://your-domain.atlassian.net)',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Atlassian account email',
    },
    apiToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Atlassian API token',
    },
    serviceDeskId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter requests by service desk ID',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of requests to return',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.siteUrl.trim().replace(/\/$/, '')
      const url = new URL(`${baseUrl}/rest/servicedeskapi/request`)
      if (params.serviceDeskId) url.searchParams.append('serviceDeskId', params.serviceDeskId)
      if (params.limit) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Basic ${Buffer.from(`${params.email}:${params.apiToken}`).toString('base64')}`,
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const values = Array.isArray(data.values) ? data.values : []
    return {
      success: true,
      output: {
        data: values,
        metadata: { count: values.length, isLastPage: data.isLastPage ?? true },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of customer request objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of requests returned' },
        isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
      },
    },
  },
}
