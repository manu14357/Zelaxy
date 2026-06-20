import type { ToolConfig } from '@/tools/types'
import type { ListMeetingsParams, ZoomListResponse } from '@/tools/zoom/types'

export const listMeetingsTool: ToolConfig<ListMeetingsParams, ZoomListResponse> = {
  id: 'zoom_list_meetings',
  name: 'Zoom List Meetings',
  description: 'List all meetings for a Zoom user',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Zoom OAuth access token',
    },
    userId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The user ID or email address. Use "me" for the authenticated user',
    },
    type: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting type filter: scheduled, live, upcoming, or previous_meetings',
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
      const userId = encodeURIComponent(params.userId || 'me')
      const url = new URL(`https://api.zoom.us/v2/users/${userId}/meetings`)
      if (params.type) url.searchParams.append('type', params.type)
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
        data: data.meetings || [],
        metadata: {
          count: (data.meetings || []).length,
          total_records: data.total_records || 0,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Zoom meeting objects' },
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
