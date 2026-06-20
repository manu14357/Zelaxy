import type { PersonaGetInquiryParams, PersonaObjectResponse } from '@/tools/persona/types'
import type { ToolConfig } from '@/tools/types'

export const getInquiryTool: ToolConfig<PersonaGetInquiryParams, PersonaObjectResponse> = {
  id: 'persona_get_inquiry',
  name: 'Persona Get Inquiry',
  description: 'Retrieve a single Persona inquiry by ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Persona API key',
    },
    id: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Inquiry ID to retrieve (starts with inq_)',
    },
  },

  request: {
    url: (params) =>
      `https://api.withpersona.com/api/v1/inquiries/${encodeURIComponent(params.id)}`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Persona-Version': '2023-01-05',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const inquiry = data.data ?? data
    return {
      success: true,
      output: { data: inquiry, metadata: { id: inquiry?.id, type: inquiry?.type } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The retrieved Persona inquiry object' },
    metadata: {
      type: 'json',
      description: 'Inquiry identifiers',
      properties: {
        id: { type: 'string', description: 'Inquiry ID' },
        type: { type: 'string', description: 'Resource type' },
      },
    },
  },
}
