import type { PostHogObjectResponse, QueryParams } from '@/tools/posthog/types'
import type { ToolConfig } from '@/tools/types'

export const queryTool: ToolConfig<QueryParams, PostHogObjectResponse> = {
  id: 'posthog_query',
  name: 'PostHog Query',
  description: 'Execute a HogQL query in a PostHog project',
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
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'HogQL query string to execute',
    },
  },

  request: {
    url: (params) => `${params.host.replace(/\/$/, '')}/api/projects/${params.projectId}/query`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      query: { kind: 'HogQLQuery', query: params.query },
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { status: 'ok' } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The HogQL query result object' },
    metadata: {
      type: 'json',
      description: 'Query metadata',
      properties: {
        status: { type: 'string', description: 'Query status' },
      },
    },
  },
}
