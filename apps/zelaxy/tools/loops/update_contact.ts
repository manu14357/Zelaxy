import type { LoopsResponse, LoopsUpdateContactParams } from '@/tools/loops/types'
import type { ToolConfig } from '@/tools/types'

export const updateContactTool: ToolConfig<LoopsUpdateContactParams, LoopsResponse> = {
  id: 'loops_update_contact',
  name: 'Loops Update Contact',
  description: 'Update an existing contact in Loops (upserts if not found)',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Loops API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The email address of the contact',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The contact first name',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The contact last name',
    },
  },

  request: {
    url: () => 'https://app.loops.so/api/v1/contacts/update',
    method: 'PUT',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = { email: params.email }
      if (params.firstName) body.firstName = params.firstName
      if (params.lastName) body.lastName = params.lastName
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { success: data.success ?? true, id: data.id } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The Loops API response' },
    metadata: {
      type: 'json',
      description: 'Contact result',
      properties: {
        success: { type: 'boolean', description: 'Whether the contact was updated' },
        id: { type: 'string', description: 'The Loops contact ID' },
      },
    },
  },
}
