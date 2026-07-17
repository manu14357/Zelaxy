import {
  JIRA_SM_PARTICIPANT_ITEM_PROPERTIES,
  type JiraSmGetParticipantsParams,
  type JiraSmGetParticipantsResponse,
} from '@/tools/jira_service_management/types'
import {
  buildJsmQuery,
  getJsmApiBaseUrl,
  getJsmHeaders,
} from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetParticipantsTool: ToolConfig<
  JiraSmGetParticipantsParams,
  JiraSmGetParticipantsResponse
> = {
  id: 'jira_service_management_get_participants',
  name: 'Jira Service Management Get Participants',
  description: 'Get participants for a request in Jira Service Management',
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
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/request/${encodeURIComponent(params.issueIdOrKey)}/participant${buildJsmQuery(
        { start: params.start, limit: params.limit }
      )}`,
    method: 'GET',
    headers: (params) => getJsmHeaders(params.accessToken),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        participants: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    participants: {
      type: 'array',
      description: 'List of participants',
      items: {
        type: 'object',
        properties: JIRA_SM_PARTICIPANT_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of participants' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
