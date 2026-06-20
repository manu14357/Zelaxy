import type { SentryListProjectsParams, SentryListResponse } from '@/tools/sentry/types'
import type { ToolConfig } from '@/tools/types'

export const listProjectsTool: ToolConfig<SentryListProjectsParams, SentryListResponse> = {
  id: 'sentry_list_projects',
  name: 'Sentry List Projects',
  description: 'List all projects accessible to the authenticated Sentry user',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sentry API authentication token',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of projects to return per page (default 25, max 100)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://sentry.io/api/0/projects/')
      if (params.limit) url.searchParams.append('per_page', String(params.limit))
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
    const projects = Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        data: projects,
        metadata: { count: projects.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Sentry project objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
      },
    },
  },
}
