import type {
  JiraSmListResponse,
  JiraSmListServiceDesksParams,
} from '@/tools/jira_service_management/types'
import {
  buildJsmQuery,
  getJsmApiBaseUrl,
  getJsmHeaders,
} from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const listServiceDesksTool: ToolConfig<JiraSmListServiceDesksParams, JiraSmListResponse> = {
  id: 'jira_service_management_list_servicedesks',
  name: 'JSM List Service Desks',
  description: 'List the service desks available in Jira Service Management',
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
      visibility: 'hidden',
      description: 'Jira Cloud ID, resolved from the domain',
    },
    start: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Index of the first item to return, for paging',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of service desks to return',
    },
  },

  request: {
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/servicedesk${buildJsmQuery({
        start: params.start,
        limit: params.limit,
      })}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data: data.values || [],
        metadata: { count: (data.values || []).length, isLastPage: data.isLastPage ?? true },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Service desks' },
    metadata: { type: 'json', description: 'Paging metadata' },
  },
}
