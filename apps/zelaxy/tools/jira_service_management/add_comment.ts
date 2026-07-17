import {
  JSM_USER_OUTPUT_PROPERTIES,
  type JsmAddCommentParams,
  type JsmAddCommentResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementAddCommentTool: ToolConfig<
  JsmAddCommentParams,
  JsmAddCommentResponse
> = {
  id: 'jira_service_management_add_comment',
  name: 'Jira Service Management Add Comment',
  description: 'Add a comment (public or internal) to a service request in Jira Service Management',
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
    body: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comment body text',
    },
    isPublic: {
      type: 'boolean',
      required: true,
      visibility: 'user-or-llm',
      description: 'Whether the comment is public (visible to customer) or internal (true/false)',
    },
  },

  request: {
    url: (params) =>
      `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/request/${encodeURIComponent(params.issueIdOrKey)}/comment`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-ExperimentalApi': 'opt-in',
    }),
    body: (params) => ({
      body: params.body,
      public: params.isPublic ?? true,
    }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        commentId: data.id,
        body: data.body,
        isPublic: data.public,
        author: data.author
          ? {
              accountId: data.author.accountId ?? null,
              displayName: data.author.displayName ?? null,
              emailAddress: data.author.emailAddress ?? null,
            }
          : null,
        createdDate: data.created ?? null,
        success: true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    commentId: { type: 'string', description: 'Created comment ID' },
    body: { type: 'string', description: 'Comment body text' },
    isPublic: { type: 'boolean', description: 'Whether the comment is public' },
    author: {
      type: 'object',
      description: 'Comment author',
      properties: JSM_USER_OUTPUT_PROPERTIES,
      optional: true,
    },
    createdDate: {
      type: 'json',
      description: 'Comment creation date with iso8601, friendly, epochMillis',
      optional: true,
    },
    success: { type: 'boolean', description: 'Whether the comment was added successfully' },
  },
}
