import type { SentryObjectResponse, SentryUpdateIssueParams } from '@/tools/sentry/types'
import type { ToolConfig } from '@/tools/types'

export const updateIssueTool: ToolConfig<SentryUpdateIssueParams, SentryObjectResponse> = {
  id: 'sentry_update_issue',
  name: 'Sentry Update Issue',
  description: 'Update a Sentry issue, for example to change its status',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sentry API authentication token',
    },
    issueId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The unique ID of the issue to update (e.g., "12345")',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New status for the issue: resolved, unresolved, or ignored',
    },
  },

  request: {
    url: (params) => `https://sentry.io/api/0/issues/${encodeURIComponent(params.issueId)}/`,
    method: 'PUT',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.status) body.status = params.status
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The updated Sentry issue object' },
    metadata: {
      type: 'json',
      description: 'Issue identifiers',
      properties: {
        id: { type: 'string', description: 'Issue ID' },
      },
    },
  },
}
