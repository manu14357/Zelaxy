import type { GetResponseParams, GoogleFormsObjectResponse } from '@/tools/google_forms/types'
import type { ToolConfig } from '@/tools/types'

export const getResponseTool: ToolConfig<GetResponseParams, GoogleFormsObjectResponse> = {
  id: 'google_forms_get_response',
  name: 'Google Forms Get Response',
  description: 'Retrieve a single response submitted to a Google Form',
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
      description: 'Google Forms form ID',
    },
    responseId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ID of the response to retrieve',
    },
  },

  request: {
    url: (params) =>
      `https://forms.googleapis.com/v1/forms/${encodeURIComponent(params.formId)}/responses/${encodeURIComponent(params.responseId)}`,
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
      output: { data, metadata: { id: data.responseId } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The form response object' },
    metadata: {
      type: 'json',
      description: 'Response identifiers',
      properties: {
        id: { type: 'string', description: 'Response ID' },
      },
    },
  },
}
