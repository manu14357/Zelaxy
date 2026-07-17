import {
  JIRA_SM_PARTICIPANT_ITEM_PROPERTIES,
  type JiraSmAddParticipantsParams,
  type JiraSmAddParticipantsResponse,
} from '@/tools/jira_service_management/types'
import { getJsmApiBaseUrl, getJsmHeaders } from '@/tools/jira_service_management/utils'
import type { ToolConfig } from '@/tools/types'

const parseAccountIds = (accountIds: string): string[] =>
  accountIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id)

export const jiraServiceManagementAddParticipantsTool: ToolConfig<
  JiraSmAddParticipantsParams,
  JiraSmAddParticipantsResponse
> = {
  id: 'jira_service_management_add_participants',
  name: 'Jira Service Management Add Participants',
  description: 'Add participants to a request in Jira Service Management',
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
    accountIds: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated Atlassian account IDs to add as participants',
    },
  },

  request: {
    url: (params) =>
      `${getJsmApiBaseUrl(params.cloudId)}/request/${encodeURIComponent(params.issueIdOrKey)}/participant`,
    method: 'POST',
    headers: (params) => getJsmHeaders(params.accessToken),
    body: (params) => ({ accountIds: parseAccountIds(params.accountIds) }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        participants: data.values || [],
        success: true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    participants: {
      type: 'array',
      description: 'List of added participants',
      items: {
        type: 'object',
        properties: JIRA_SM_PARTICIPANT_ITEM_PROPERTIES,
      },
    },
    success: { type: 'boolean', description: 'Whether the operation succeeded' },
  },
}
