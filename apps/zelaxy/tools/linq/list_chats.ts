import type { LinqListChatsParams, LinqListResponse } from '@/tools/linq/types'
import type { ToolConfig } from '@/tools/types'

export const listChatsTool: ToolConfig<LinqListChatsParams, LinqListResponse> = {
  id: 'linq_list_chats',
  name: 'Linq List Chats',
  description: 'List Linq chats, optionally filtered by sender or participant handle',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Linq API key',
    },
    from: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by sender phone number in E.164 format',
    },
    to: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by participant handle (phone number or email)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Results per page (default 20, max 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from a previous response',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.linqapp.com/api/partner/v3/chats')
      if (params.from) url.searchParams.set('from', params.from)
      if (params.to) url.searchParams.set('to', params.to)
      if (typeof params.limit === 'number') url.searchParams.set('limit', String(params.limit))
      if (params.cursor) url.searchParams.set('cursor', params.cursor)
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const chats = json.chats ?? []
    return {
      success: true,
      output: {
        data: chats,
        metadata: { count: chats.length, nextCursor: json.next_cursor ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Linq chat objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of chats returned' },
        nextCursor: { type: 'string', description: 'Cursor for the next page (null when none)' },
      },
    },
  },
}
