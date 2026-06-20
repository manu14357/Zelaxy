import type { ToolConfig } from '@/tools/types'
import type { CreateMeetingParams, ZoomObjectResponse } from '@/tools/zoom/types'

export const createMeetingTool: ToolConfig<CreateMeetingParams, ZoomObjectResponse> = {
  id: 'zoom_create_meeting',
  name: 'Zoom Create Meeting',
  description: 'Create a new Zoom meeting for a user',
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
    topic: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Meeting topic',
    },
    type: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting type: 1=instant, 2=scheduled, 3=recurring, 8=recurring fixed time',
    },
    start_time: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting start time in ISO 8601 format (e.g. 2025-06-03T10:00:00Z)',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting duration in minutes',
    },
    timezone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Timezone for the meeting (e.g. America/Los_Angeles)',
    },
    agenda: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Meeting agenda or description',
    },
  },

  request: {
    url: (params) => {
      const userId = encodeURIComponent(params.userId || 'me')
      return `https://api.zoom.us/v2/users/${userId}/meetings`
    },
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {
        topic: params.topic,
        type: params.type || 2,
      }
      if (params.start_time) body.start_time = params.start_time
      if (params.duration != null) body.duration = params.duration
      if (params.timezone) body.timezone = params.timezone
      if (params.agenda) body.agenda = params.agenda
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: String(data.id), topic: data.topic } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Zoom meeting object' },
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
