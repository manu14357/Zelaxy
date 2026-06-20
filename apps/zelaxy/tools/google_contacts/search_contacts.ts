import type {
  GoogleContactsListResponse,
  SearchContactsParams,
} from '@/tools/google_contacts/types'
import type { ToolConfig } from '@/tools/types'

export const searchContactsTool: ToolConfig<SearchContactsParams, GoogleContactsListResponse> = {
  id: 'google_contacts_search_contacts',
  name: 'Google Contacts Search Contacts',
  description: 'Search contacts in Google Contacts by name, email, or phone',
  version: '1.0.0',

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google OAuth access token',
    },
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query to match against contact names, emails, and phones',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (max 30)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://people.googleapis.com/v1/people:searchContacts')
      url.searchParams.append('query', params.query)
      url.searchParams.append('readMask', 'names,emailAddresses')
      if (params.pageSize) url.searchParams.append('pageSize', String(params.pageSize))
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
    const results = data.results || []
    const contacts = results.map((result: Record<string, any>) => result.person || result)
    return {
      success: true,
      output: {
        data: contacts,
        metadata: { count: contacts.length, nextPageToken: data.nextPageToken || null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of matching contact (person) objects' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        count: { type: 'number', description: 'Number of contacts returned' },
        nextPageToken: { type: 'string', description: 'Token for the next page' },
      },
    },
  },
}
