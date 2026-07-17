import type {
  JsmTransitionRequestParams,
  JsmTransitionRequestResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementTransitionRequestTool: ToolConfig<
  JsmTransitionRequestParams,
  JsmTransitionRequestResponse
> = {
  id: 'jira_service_management_transition_request',
  name: 'Jira Service Management Transition Request',
  description: 'Transition a service request to a new status in Jira Service Management',
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
    transitionId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Transition ID to apply',
    },
    comment: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional comment to add during transition',
    },
  },

  request: {
    url: (params) =>
      `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/request/${encodeURIComponent(params.issueIdOrKey)}/transition`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-ExperimentalApi': 'opt-in',
    }),
    body: (params) => ({
      id: params.transitionId,
      ...(params.comment ? { additionalComment: { body: params.comment } } : {}),
    }),
  },

  // The transition endpoint answers 204 with an empty body, so there is nothing to parse.
  transformResponse: async (_response, params) => ({
    success: true,
    output: {
      ts: new Date().toISOString(),
      issueIdOrKey: params?.issueIdOrKey ?? '',
      transitionId: params?.transitionId ?? '',
      success: true,
    },
  }),

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    transitionId: { type: 'string', description: 'Applied transition ID' },
    success: { type: 'boolean', description: 'Whether the transition was successful' },
  },
}
