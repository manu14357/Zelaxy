import type { GetFormParams, GoogleFormsObjectResponse } from '@/tools/google_forms/types'
import type { ToolConfig } from '@/tools/types'

export const getFormTool: ToolConfig<GetFormParams, GoogleFormsObjectResponse> = {
  id: 'google_forms_get_form',
  name: 'Google Forms Get Form',
  description: 'Retrieve a Google Form structure including its items, settings, and metadata',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    formId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Google Forms form ID to retrieve',
    },
  },

  request: {
    url: (params) => `https://forms.googleapis.com/v1/forms/${encodeURIComponent(params.formId)}`,
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
      output: { data, metadata: { id: data.formId } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Google Form object' },
    metadata: {
      type: 'json',
      description: 'Form identifiers',
      properties: {
        id: { type: 'string', description: 'Form ID' },
      },
    },
  },
}
