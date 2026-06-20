import type { GetContactParams, IntercomObjectResponse } from '@/tools/intercom/types'
import type { ToolConfig } from '@/tools/types'

export const getContactTool: ToolConfig<GetContactParams, IntercomObjectResponse> = {
  id: 'intercom_get_contact',
  name: 'Intercom Get Contact',
  description: 'Get a single contact from Intercom by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Intercom API access token',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The unique identifier of the contact',
    },
  },

  request: {
    url: (params) => `https://api.intercom.io/contacts/${encodeURIComponent(params.id)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id, type: data.type } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Intercom contact object' },
    metadata: {
      type: 'json',
      description: 'Contact identifiers',
      properties: {
        id: { type: 'string', description: 'Contact ID' },
        type: { type: 'string', description: 'Object type' },
      },
    },
  },
}
