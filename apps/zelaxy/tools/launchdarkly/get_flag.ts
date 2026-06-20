import type { GetFlagParams, LaunchDarklyObjectResponse } from '@/tools/launchdarkly/types'
import type { ToolConfig } from '@/tools/types'

export const getFlagTool: ToolConfig<GetFlagParams, LaunchDarklyObjectResponse> = {
  id: 'launchdarkly_get_flag',
  name: 'LaunchDarkly Get Flag',
  description: 'Get a single feature flag by key',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LaunchDarkly API access token',
    },
    projectKey: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Project key (default "default")',
    },
    flagKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The key of the feature flag to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://app.launchdarkly.com/api/v2/flags/${params.projectKey || 'default'}/${params.flagKey}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { key: data.key, name: data.name } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The feature flag object' },
    metadata: {
      type: 'json',
      description: 'Flag identifiers',
      properties: {
        key: { type: 'string', description: 'Flag key' },
        name: { type: 'string', description: 'Flag name' },
      },
    },
  },
}
