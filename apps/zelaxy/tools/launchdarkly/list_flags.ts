import type { LaunchDarklyListResponse, ListFlagsParams } from '@/tools/launchdarkly/types'
import type { ToolConfig } from '@/tools/types'

export const listFlagsTool: ToolConfig<ListFlagsParams, LaunchDarklyListResponse> = {
  id: 'launchdarkly_list_flags',
  name: 'LaunchDarkly List Flags',
  description: 'List feature flags for a LaunchDarkly project',
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
  },

  request: {
    url: (params) => `https://app.launchdarkly.com/api/v2/flags/${params.projectKey || 'default'}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: params.apiKey,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items || []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, totalCount: data.totalCount },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of feature flag objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of flags returned' },
        totalCount: { type: 'number', description: 'Total number of flags available' },
      },
    },
  },
}
