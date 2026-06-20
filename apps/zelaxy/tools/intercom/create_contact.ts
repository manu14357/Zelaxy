import type { CreateContactParams, IntercomObjectResponse } from '@/tools/intercom/types'
import type { ToolConfig } from '@/tools/types'

export const createContactTool: ToolConfig<CreateContactParams, IntercomObjectResponse> = {
  id: 'intercom_create_contact',
  name: 'Intercom Create Contact',
  description: 'Create a new contact in Intercom',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Intercom API access token',
    },
    role: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The role of the contact: 'user' or 'lead'",
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The contact's email address",
    },
    name: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The contact's name",
    },
    phone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: "The contact's phone number",
    },
  },

  request: {
    url: () => 'https://api.intercom.io/contacts',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    }),
    body: (params) => {
      const body: Record<string, any> = {}
      if (params.role) body.role = params.role
      if (params.email) body.email = params.email
      if (params.name) body.name = params.name
      if (params.phone) body.phone = params.phone
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { id: data.id, type: data.type } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created Intercom contact object' },
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
