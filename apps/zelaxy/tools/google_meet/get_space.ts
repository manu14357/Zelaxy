import type { GoogleMeetGetSpaceParams, GoogleMeetObjectResponse } from '@/tools/google_meet/types'
import type { ToolConfig } from '@/tools/types'

export const getSpaceTool: ToolConfig<GoogleMeetGetSpaceParams, GoogleMeetObjectResponse> = {
  id: 'google_meet_get_space',
  name: 'Google Meet Get Space',
  description: 'Get details of a Google Meet meeting space by name or meeting code',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for Google Meet',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Space resource name (spaces/abc123) or meeting code (abc-defg-hij)',
    },
  },

  request: {
    url: (params) => {
      const trimmed = params.name.trim()
      const name = trimmed.startsWith('spaces/') ? trimmed : `spaces/${trimmed}`
      return `https://meet.googleapis.com/v2/${name}`
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get Google Meet space')
    }
    return {
      success: true,
      output: {
        data,
        metadata: { name: data.name, meetingCode: data.meetingCode },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Google Meet space object' },
    metadata: {
      type: 'json',
      description: 'Space identifiers',
      properties: {
        name: { type: 'string', description: 'Resource name of the space' },
        meetingCode: { type: 'string', description: 'Meeting code' },
      },
    },
  },
}
