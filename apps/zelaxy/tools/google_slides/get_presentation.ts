import type { GetPresentationParams, GoogleSlidesObjectResponse } from '@/tools/google_slides/types'
import type { ToolConfig } from '@/tools/types'

export const getPresentationTool: ToolConfig<GetPresentationParams, GoogleSlidesObjectResponse> = {
  id: 'google_slides_get_presentation',
  name: 'Google Slides Get Presentation',
  description: 'Read content and metadata from a Google Slides presentation',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    presentationId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Google Slides presentation ID',
    },
  },

  request: {
    url: (params) =>
      `https://slides.googleapis.com/v1/presentations/${encodeURIComponent(params.presentationId)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { presentationId: data.presentationId } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Google Slides presentation object' },
    metadata: {
      type: 'json',
      description: 'Presentation identifiers',
      properties: {
        presentationId: { type: 'string', description: 'Presentation ID' },
      },
    },
  },
}
