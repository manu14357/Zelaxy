import type {
  JiraSmListRequestsParams,
  JiraSmListResponse,
} from '@/tools/jira_service_management/types'
import {
  buildJsmQuery,
  getJsmApiBaseUrl,
  getJsmHeaders,
} from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const listRequestsTool: ToolConfig<JiraSmListRequestsParams, JiraSmListResponse> = {
  id: 'jira_service_management_list_requests',
  name: 'Jira Service Management List Requests',
  description: 'List customer requests, optionally scoped to a service desk',
  version: '2.0.0',

  oauth: {
    required: true,
    provider: 'jira',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Jira Service Management',
    },
    cloudId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Jira Cloud ID',
    },
    requestOwnership: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by ownership (OWNED_REQUESTS, PARTICIPATED_REQUESTS, ALL_REQUESTS)',
    },
    requestStatus: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by status (OPEN_REQUESTS, CLOSED_REQUESTS, ALL_REQUESTS)',
    },
    searchTerm: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter requests by summary text',
    },
    start: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Index of the first item to return, for paging',
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
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/request${buildJsmQuery({ serviceDeskId: params.serviceDeskId, requestOwnership: params.requestOwnership, requestStatus: params.requestStatus, searchTerm: params.searchTerm, start: params.start, limit: params.limit })}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
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
