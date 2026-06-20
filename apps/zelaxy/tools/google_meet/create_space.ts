import type {
  GoogleMeetCreateSpaceParams,
  GoogleMeetObjectResponse,
} from '@/tools/google_meet/types'
import type { ToolConfig } from '@/tools/types'

export const createSpaceTool: ToolConfig<GoogleMeetCreateSpaceParams, GoogleMeetObjectResponse> = {
  id: 'google_meet_create_space',
  name: 'Google Meet Create Space',
  description: 'Create a new Google Meet meeting space',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'OAuth access token for Google Meet',
    },
  },

  request: {
    url: () => 'https://meet.googleapis.com/v2/spaces',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: () => ({}),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create Google Meet space')
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
    data: { type: 'json', description: 'The created Google Meet space object' },
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
