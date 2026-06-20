import type { SentryListIssuesParams, SentryListResponse } from '@/tools/sentry/types'
import type { ToolConfig } from '@/tools/types'

export const listIssuesTool: ToolConfig<SentryListIssuesParams, SentryListResponse> = {
  id: 'sentry_list_issues',
  name: 'Sentry List Issues',
  description: 'List issues for a specific Sentry project',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sentry API authentication token',
    },
    organizationSlug: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The slug of the organization (e.g., "my-org")',
    },
    projectSlug: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The slug of the project (e.g., "my-project")',
    },
    query: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Search query (e.g., "is:unresolved", "level:error")',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://sentry.io/api/0/projects/${encodeURIComponent(params.organizationSlug)}/${encodeURIComponent(params.projectSlug)}/issues/`
      )
      if (params.query) url.searchParams.append('query', params.query)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const issues = Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        data: issues,
        metadata: { count: issues.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Sentry issue objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
