import type {
  CreateContactParams,
  GoogleContactsObjectResponse,
} from '@/tools/google_contacts/types'
import type { ToolConfig } from '@/tools/types'

export const createContactTool: ToolConfig<CreateContactParams, GoogleContactsObjectResponse> = {
  id: 'google_contacts_create_contact',
  name: 'Google Contacts Create Contact',
  description: 'Create a new contact in Google Contacts',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    givenName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'First name of the contact',
    },
    familyName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Last name of the contact',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address of the contact',
    },
    phone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Phone number of the contact',
    },
  },

  request: {
    url: () => 'https://people.googleapis.com/v1/people:createContact',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const person: Record<string, any> = {
        names: [
          {
            givenName: params.givenName,
            ...(params.familyName ? { familyName: params.familyName } : {}),
          },
        ],
      }
      if (params.email) person.emailAddresses = [{ value: params.email }]
      if (params.phone) person.phoneNumbers = [{ value: params.phone }]
      return person
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: { data, metadata: { resourceName: data.resourceName } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The created contact (person) object' },
    metadata: {
      type: 'json',
      description: 'Contact identifiers',
      properties: {
        resourceName: { type: 'string', description: 'Contact resource name' },
      },
    },
  },
}
