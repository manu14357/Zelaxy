import type { SentryGetIssueParams, SentryObjectResponse } from '@/tools/sentry/types'
import type { ToolConfig } from '@/tools/types'

export const getIssueTool: ToolConfig<SentryGetIssueParams, SentryObjectResponse> = {
  id: 'sentry_get_issue',
  name: 'Sentry Get Issue',
  description: 'Retrieve detailed information about a specific Sentry issue',
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
      description: 'The unique ID of the issue to retrieve (e.g., "12345")',
    },
  },

  request: {
    url: (params) => `https://sentry.io/api/0/issues/${encodeURIComponent(params.issueId)}/`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Sentry issue object' },
    metadata: {
      type: 'json',
      description: 'Issue identifiers',
      properties: {
        id: { type: 'string', description: 'Issue ID' },
      },
    },
  },
}
