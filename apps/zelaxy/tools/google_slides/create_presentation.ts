import type {
  CreatePresentationParams,
  GoogleSlidesObjectResponse,
} from '@/tools/google_slides/types'
import type { ToolConfig } from '@/tools/types'

export const createPresentationTool: ToolConfig<
  CreatePresentationParams,
  GoogleSlidesObjectResponse
> = {
  id: 'google_slides_create_presentation',
  name: 'Google Slides Create Presentation',
  description: 'Create a new Google Slides presentation',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The title of the presentation to create',
    },
  },

  request: {
    url: () => 'https://slides.googleapis.com/v1/presentations',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ title: params.title }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { presentationId: data.presentationId } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Google Slides presentation object' },
    metadata: {
      type: 'json',
      description: 'Presentation identifiers',
      properties: {
        presentationId: { type: 'string', description: 'Presentation ID' },
      },
    },
  },
}
