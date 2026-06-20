import type { ToolConfig } from '@/tools/types'
import type { GetMeetingParams, ZoomObjectResponse } from '@/tools/zoom/types'

export const getMeetingTool: ToolConfig<GetMeetingParams, ZoomObjectResponse> = {
  id: 'zoom_get_meeting',
  name: 'Zoom Get Meeting',
  description: 'Get details of a specific Zoom meeting',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Zoom OAuth access token',
    },
    meetingId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The Zoom meeting ID',
    },
  },

  request: {
    url: (params) => `https://api.zoom.us/v2/meetings/${encodeURIComponent(params.meetingId)}`,
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
      output: { data, metadata: { id: String(data.id), topic: data.topic } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Zoom meeting object' },
    metadata: {
      type: 'json',
      description: 'Meeting identifiers',
      properties: {
        id: { type: 'string', description: 'Meeting ID' },
        topic: { type: 'string', description: 'Meeting topic' },
      },
    },
  },
}
