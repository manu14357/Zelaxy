import type { LinqListMessagesParams, LinqListResponse } from '@/tools/linq/types'
import type { ToolConfig } from '@/tools/types'

export const listMessagesTool: ToolConfig<LinqListMessagesParams, LinqListResponse> = {
  id: 'linq_list_messages',
  name: 'Linq List Messages',
  description: 'List messages in a Linq chat with pagination',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Linq API key',
    },
    chatId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The unique identifier of the chat',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of messages to return',
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
      const url = new URL(
        `https://api.linqapp.com/api/partner/v3/chats/${encodeURIComponent(params.chatId.trim())}/messages`
      )
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
    const messages = json.messages ?? []
    return {
      success: true,
      output: {
        data: messages,
        metadata: { count: messages.length, nextCursor: json.next_cursor ?? null },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of Linq message objects' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of messages returned' },
        nextCursor: { type: 'string', description: 'Cursor for the next page (null when none)' },
      },
    },
  },
}
