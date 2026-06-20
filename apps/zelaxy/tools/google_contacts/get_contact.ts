import type { GetContactParams, GoogleContactsObjectResponse } from '@/tools/google_contacts/types'
import type { ToolConfig } from '@/tools/types'

export const getContactTool: ToolConfig<GetContactParams, GoogleContactsObjectResponse> = {
  id: 'google_contacts_get_contact',
  name: 'Google Contacts Get Contact',
  description: 'Get a specific contact from Google Contacts',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    resourceName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Resource name of the contact (e.g., people/c1234567890)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(`https://people.googleapis.com/v1/${params.resourceName.trim()}`)
      url.searchParams.append('personFields', 'names,emailAddresses')
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
    return {
      success: true,
      output: { data, metadata: { resourceName: data.resourceName } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The contact (person) object' },
    metadata: {
      type: 'json',
      description: 'Contact identifiers',
      properties: {
        resourceName: { type: 'string', description: 'Contact resource name' },
      },
    },
  },
}
