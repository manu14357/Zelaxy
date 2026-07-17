import {
  JSM_COMMENT_ITEM_PROPERTIES,
  type JsmGetCommentsParams,
  type JsmGetCommentsResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementGetCommentsTool: ToolConfig<
  JsmGetCommentsParams,
  JsmGetCommentsResponse
> = {
  id: 'jira_service_management_get_comments',
  name: 'Jira Service Management Get Comments',
  description: 'Get comments for a service request in Jira Service Management',
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
    isPublic: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter to only public comments (true/false)',
    },
    internal: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter to only internal comments (true/false)',
    },
    expand: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated fields to expand: renderedBody, attachment',
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
        `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/request/${encodeURIComponent(params.issueIdOrKey)}/comment`
      )
      if (params.isPublic !== undefined) {
        url.searchParams.append('public', String(params.isPublic))
      }
      if (params.internal !== undefined) {
        url.searchParams.append('internal', String(params.internal))
      }
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

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        comments: data.values || [],
        total: data.size || 0,
        isLastPage: data.isLastPage ?? true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    comments: {
      type: 'array',
      description: 'List of comments',
      items: {
        type: 'object',
        properties: JSM_COMMENT_ITEM_PROPERTIES,
      },
    },
    total: { type: 'number', description: 'Total number of comments' },
    isLastPage: { type: 'boolean', description: 'Whether this is the last page' },
  },
}
