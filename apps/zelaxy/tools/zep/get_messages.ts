import type { ToolConfig } from '@/tools/types'
import type { ZepResponse } from '@/tools/zep/types'

// Get messages from a Zep thread
export const zepGetMessagesTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_get_messages',
  name: 'Zep Get Messages',
  description: 'Retrieve the messages stored in a Zep thread',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zep API key',
    },
    threadId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Identifier of the thread to read messages from',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of messages to return',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.getzep.com/api/v2/threads/${encodeURIComponent(params.threadId)}/messages`
      )
      if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
        url.searchParams.set('limit', String(params.limit))
      }
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    return {
      success: true,
      output: {
        messages: Array.isArray(data?.messages) ? data.messages : [],
        total_count: data?.total_count,
        row_count: data?.row_count,
      },
    }
  },

  outputs: {
    messages: { type: 'array', description: 'Messages stored in the thread' },
    total_count: { type: 'number', description: 'Total number of messages', optional: true },
    row_count: { type: 'number', description: 'Number of messages returned', optional: true },
  },
}
