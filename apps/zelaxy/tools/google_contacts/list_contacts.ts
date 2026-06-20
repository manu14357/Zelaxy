import type { GoogleContactsListResponse, ListContactsParams } from '@/tools/google_contacts/types'
import type { ToolConfig } from '@/tools/types'

export const listContactsTool: ToolConfig<ListContactsParams, GoogleContactsListResponse> = {
  id: 'google_contacts_list_contacts',
  name: 'Google Contacts List Contacts',
  description: 'List contacts from Google Contacts',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of contacts to return (1-1000)',
    },
    pageToken: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page token from a previous list request for pagination',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://people.googleapis.com/v1/people/me/connections')
      url.searchParams.append('personFields', 'names,emailAddresses,phoneNumbers')
      if (params.pageSize) url.searchParams.append('pageSize', String(params.pageSize))
      if (params.pageToken) url.searchParams.append('pageToken', params.pageToken)
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
    const connections = data.connections || []
    return {
      success: true,
      output: {
        data: connections,
        metadata: { count: connections.length, nextPageToken: data.nextPageToken || null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of contact (person) objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of contacts returned' },
        nextPageToken: { type: 'string', description: 'Token for the next page' },
      },
    },
  },
}
