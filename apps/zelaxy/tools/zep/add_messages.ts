import type { ToolConfig } from '@/tools/types'
import type { ZepResponse } from '@/tools/zep/types'

// Add Messages to a Zep thread
export const zepAddMessagesTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_add_messages',
  name: 'Zep Add Messages',
  description: 'Add one or more messages to a Zep thread for long-term agent memory',
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
      description: 'Identifier of the thread to add messages to',
    },
    messages: {
      type: 'json',
      required: true,
      visibility: 'user-or-llm',
      description: 'Array of message objects, each with a role and content',
    },
  },

  request: {
    url: (params) =>
      `https://api.getzep.com/api/v2/threads/${encodeURIComponent(params.threadId)}/messages`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      let messagesArray = params.messages
      if (typeof messagesArray === 'string') {
        try {
          messagesArray = JSON.parse(messagesArray)
        } catch (_e) {
          throw new Error('Messages must be a valid JSON array of message objects')
        }
      }

      if (!Array.isArray(messagesArray) || messagesArray.length === 0) {
        throw new Error('Messages must be a non-empty array')
      }

      for (const msg of messagesArray) {
        if (!msg || typeof msg !== 'object' || !msg.content) {
          throw new Error('Each message must include a content property')
        }
      }

      return { messages: messagesArray }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    return {
      success: true,
      output: {
        success: true,
        messages: Array.isArray(data?.messages) ? data.messages : undefined,
        result: data,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the messages were added' },
    messages: {
      type: 'array',
      description: 'The messages that were persisted (when returned by the API)',
      optional: true,
    },
    result: { type: 'json', description: 'Raw API response', optional: true },
  },
}
