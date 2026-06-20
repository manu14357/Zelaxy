import type { BrexListResponse, BrexListUsersParams } from '@/tools/brex/types'
import type { ToolConfig } from '@/tools/types'

export const listUsersTool: ToolConfig<BrexListUsersParams, BrexListResponse> = {
  id: 'brex_list_users',
  name: 'Brex List Users',
  description: 'List users in the Brex account, optionally filtered by email',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Brex user token (generated from Developer Settings in the Brex dashboard)',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter users by exact email address',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of users to return (default 100, max 1000)',
    },
  },

  request: {
    url: (params) => {
      const query = new URLSearchParams()
      if (params.email) query.append('email', params.email.trim())
      if (params.cursor) query.append('cursor', params.cursor)
      if (params.limit) query.append('limit', params.limit)
      const qs = query.toString()
      return qs ? `https://api.brex.com/v2/users?${qs}` : 'https://api.brex.com/v2/users'
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const items = data.items ?? []
    return {
      success: true,
      output: {
        data: items,
        metadata: { count: items.length, next_cursor: data.next_cursor ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Brex user objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of items returned' },
        next_cursor: { type: 'string', description: 'Cursor for the next page of results' },
      },
    },
  },
}
