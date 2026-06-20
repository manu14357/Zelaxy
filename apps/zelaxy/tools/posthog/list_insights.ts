import type { ListInsightsParams, PostHogListResponse } from '@/tools/posthog/types'
import type { ToolConfig } from '@/tools/types'

export const listInsightsTool: ToolConfig<ListInsightsParams, PostHogListResponse> = {
  id: 'posthog_list_insights',
  name: 'PostHog List Insights',
  description: 'List insights in a PostHog project',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PostHog host (e.g. https://us.posthog.com)',
    },
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'PostHog personal API key',
    },
    projectId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'PostHog project ID',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/api/projects/${params.projectId}/insights`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const list = data?.results || []
    return {
      success: true,
      output: { data: list, metadata: { count: list.length } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of insight objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of insights returned' },
      },
    },
  },
}
