import type { GoogleFormsListResponse, ListResponsesParams } from '@/tools/google_forms/types'
import type { ToolConfig } from '@/tools/types'

export const listResponsesTool: ToolConfig<ListResponsesParams, GoogleFormsListResponse> = {
  id: 'google_forms_list_responses',
  name: 'Google Forms List Responses',
  description: 'List responses submitted to a Google Form',
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
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of responses to return',
    },
    pageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page token from a previous list response to fetch the next page',
    },
    filter: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter responses, e.g. "timestamp > 2024-01-01T00:00:00Z"',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://forms.googleapis.com/v1/forms/${encodeURIComponent(params.formId)}/responses`
      )
      if (params.pageSize) url.searchParams.append('pageSize', String(params.pageSize))
      if (params.pageToken) url.searchParams.append('pageToken', params.pageToken)
      if (params.filter) url.searchParams.append('filter', params.filter)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const responses = data.responses || []
    return {
      success: true,
      output: {
        data: responses,
        metadata: { count: responses.length, nextPageToken: data.nextPageToken || null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of form response objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of responses returned' },
        nextPageToken: {
          type: 'string',
          description: 'Token to fetch the next page of responses',
        },
      },
    },
  },
}
