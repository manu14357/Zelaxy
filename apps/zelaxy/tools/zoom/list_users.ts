import type { ToolConfig } from '@/tools/types'
import type { ListUsersParams, ZoomListResponse } from '@/tools/zoom/types'

export const listUsersTool: ToolConfig<ListUsersParams, ZoomListResponse> = {
  id: 'zoom_list_users',
  name: 'Zoom List Users',
  description: 'List users on a Zoom account',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Zoom OAuth access token',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'User status filter: active, inactive, or pending',
    },
    page_size: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of records per page (1-300)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.zoom.us/v2/users')
      if (params.status) url.searchParams.append('status', params.status)
      if (params.page_size) url.searchParams.append('page_size', String(params.page_size))
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
    return {
      success: true,
      output: {
        data: data.users || [],
        metadata: {
          count: (data.users || []).length,
          total_records: data.total_records || 0,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Zoom user objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        total_records: { type: 'number', description: 'Total number of records available' },
      },
    },
  },
}
