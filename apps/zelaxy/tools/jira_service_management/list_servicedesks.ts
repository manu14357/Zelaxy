import type {
  JiraSmListResponse,
  JiraSmListServiceDesksParams,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const listServiceDesksTool: ToolConfig<JiraSmListServiceDesksParams, JiraSmListResponse> = {
  id: 'jira_service_management_list_servicedesks',
  name: 'Jira Service Management List Service Desks',
  description: 'List the service desks available in Jira Service Management',
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
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of service desks to return',
    },
  },

  request: {
    url: (params) => {
      const baseUrl = params.siteUrl.trim().replace(/\/$/, '')
      const url = new URL(`${baseUrl}/rest/servicedeskapi/servicedesk`)
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
    data: { type: 'json', description: 'Array of service desk objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of service desks returned' },
        isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
      },
    },
  },
}
