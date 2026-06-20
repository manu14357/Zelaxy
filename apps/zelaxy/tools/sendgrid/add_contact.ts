import type { AddContactParams, SendgridObjectResponse } from '@/tools/sendgrid/types'
import type { ToolConfig } from '@/tools/types'

export const addContactTool: ToolConfig<AddContactParams, SendgridObjectResponse> = {
  id: 'sendgrid_add_contact',
  name: 'SendGrid Add Contact',
  description: 'Add or update a marketing contact in SendGrid',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'SendGrid API key',
    },
    email: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Contact email address',
    },
    firstName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Contact first name',
    },
    lastName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Contact last name',
    },
  },

  request: {
    url: () => 'https://api.sendgrid.com/v3/marketing/contacts',
    method: 'PUT',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const contact: Record<string, any> = { email: params.email }
      if (params.firstName) contact.first_name = params.firstName
      if (params.lastName) contact.last_name = params.lastName
      return { contacts: [contact] }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { statusCode: response.status } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The SendGrid contact job response' },
    metadata: {
      type: 'json',
      description: 'Response metadata',
      properties: {
        statusCode: { type: 'number', description: 'HTTP status code' },
      },
    },
  },
}
