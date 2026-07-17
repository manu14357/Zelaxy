import {
  JSM_TRANSITION_ITEM_PROPERTIES,
  type JsmGetTransitionsParams,
  type JsmGetTransitionsResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetTransitionsTool: ToolConfig<
  JsmGetTransitionsParams,
  JsmGetTransitionsResponse
> = {
  id: 'jira_service_management_get_transitions',
  name: 'Jira Service Management Get Transitions',
  description: 'Get available transitions for a service request in Jira Service Management',
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
    issueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Issue ID or key (e.g., SD-123)',
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
        `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/request/${encodeURIComponent(params.issueIdOrKey)}/transition`
      )
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

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        transitions: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    transitions: {
      type: 'array',
      description: 'List of available transitions',
      items: {
        type: 'object',
        properties: JSM_TRANSITION_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of transitions' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
