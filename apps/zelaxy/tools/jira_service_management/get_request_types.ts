import {
  JSM_REQUEST_TYPE_ITEM_PROPERTIES,
  type JsmGetRequestTypesParams,
  type JsmGetRequestTypesResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetRequestTypesTool: ToolConfig<
  JsmGetRequestTypesParams,
  JsmGetRequestTypesResponse
> = {
  id: 'jira_service_management_get_request_types',
  name: 'Jira Service Management Get Request Types',
  description: 'Get request types for a service desk in Jira Service Management',
  version: '1.0.0',

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
      description: 'Jira Cloud ID for the instance',
    },
    serviceDeskId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Service Desk ID (e.g., "1", "2")',
    },
    searchQuery: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter request types by name',
    },
    groupId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by request type group ID',
    },
    expand: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated fields to expand in the response',
    },
    start: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start index for pagination (e.g., 0, 50, 100)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum results to return (e.g., 10, 25, 50)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/servicedesk/${encodeURIComponent(params.serviceDeskId)}/requesttype`
      )
      if (params.searchQuery) url.searchParams.append('searchQuery', params.searchQuery)
      if (params.groupId) url.searchParams.append('groupId', params.groupId)
      if (params.expand) url.searchParams.append('expand', params.expand)
      if (params.start !== undefined) url.searchParams.append('start', String(params.start))
      if (params.limit !== undefined) url.searchParams.append('limit', String(params.limit))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-ExperimentalApi': 'opt-in',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        requestTypes: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    requestTypes: {
      type: 'array',
      description: 'List of request types',
      items: {
        type: 'object',
        properties: JSM_REQUEST_TYPE_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of request types' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
