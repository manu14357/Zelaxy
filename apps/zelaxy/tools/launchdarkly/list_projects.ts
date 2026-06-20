import type { LaunchDarklyListResponse, ListProjectsParams } from '@/tools/launchdarkly/types'
import type { ToolConfig } from '@/tools/types'

export const listProjectsTool: ToolConfig<ListProjectsParams, LaunchDarklyListResponse> = {
  id: 'launchdarkly_list_projects',
  name: 'LaunchDarkly List Projects',
  description: 'List LaunchDarkly projects',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'LaunchDarkly API access token',
    },
  },

  request: {
    url: () => 'https://app.launchdarkly.com/api/v2/projects',
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
    data: { type: 'json', description: 'Array of project objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of projects returned' },
        totalCount: { type: 'number', description: 'Total number of projects available' },
      },
    },
  },
}
