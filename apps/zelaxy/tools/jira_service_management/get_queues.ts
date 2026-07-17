import {
  JSM_QUEUE_ITEM_PROPERTIES,
  type JsmGetQueuesParams,
  type JsmGetQueuesResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetQueuesTool: ToolConfig<
  JsmGetQueuesParams,
  JsmGetQueuesResponse
> = {
  id: 'jira_service_management_get_queues',
  name: 'Jira Service Management Get Queues',
  description: 'Get queues for a service desk in Jira Service Management',
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
    includeCount: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include issue count for each queue (true/false)',
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
        `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/servicedesk/${encodeURIComponent(params.serviceDeskId)}/queue`
      )
      if (params.includeCount !== undefined) {
        url.searchParams.append('includeCount', String(params.includeCount))
      }
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
        queues: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    queues: {
      type: 'array',
      description: 'List of queues',
      items: {
        type: 'object',
        properties: JSM_QUEUE_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of queues' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
