import type {
  GoogleGroupsListGroupsParams,
  GoogleGroupsListResponse,
} from '@/tools/google_groups/types'
import type { ToolConfig } from '@/tools/types'

export const listGroupsTool: ToolConfig<GoogleGroupsListGroupsParams, GoogleGroupsListResponse> = {
  id: 'google_groups_list_groups',
  name: 'Google Groups List Groups',
  description: 'List all groups in a Google Workspace domain',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for Google Groups',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of results to return (1-200)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://admin.googleapis.com/admin/directory/v1/groups')
      url.searchParams.set('customer', 'my_customer')
      if (params.maxResults) url.searchParams.set('maxResults', String(params.maxResults))
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to list groups')
    }
    const groups = data.groups || []
    return {
      success: true,
      output: {
        data: groups,
        metadata: { count: groups.length, nextPageToken: data.nextPageToken },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Google Group objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of groups returned' },
        nextPageToken: { type: 'string', description: 'Token for fetching the next page' },
      },
    },
  },
}
