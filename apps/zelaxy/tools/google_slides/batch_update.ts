import type { BatchUpdateParams, GoogleSlidesObjectResponse } from '@/tools/google_slides/types'
import type { ToolConfig } from '@/tools/types'

export const batchUpdateTool: ToolConfig<BatchUpdateParams, GoogleSlidesObjectResponse> = {
  id: 'google_slides_batch_update',
  name: 'Google Slides Batch Update',
  description: 'Apply a batch of update requests to a Google Slides presentation',
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
    requests: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Array of Slides API Request objects to apply',
    },
  },

  request: {
    url: (params) =>
      `https://slides.googleapis.com/v1/presentations/${encodeURIComponent(params.presentationId)}:batchUpdate`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ requests: params.requests }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { presentationId: data.presentationId } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The batch update response including replies' },
    metadata: {
      type: 'json',
      description: 'Presentation identifiers',
      properties: {
        presentationId: { type: 'string', description: 'Presentation ID' },
      },
    },
  },
}
