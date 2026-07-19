import type { ToolConfig } from '@/tools/types'
import { THREAD_OUTPUT_PROPERTIES, type ZepResponse } from '@/tools/zep/types'

// Create a Zep thread
export const zepCreateThreadTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_create_thread',
  name: 'Zep Create Thread',
  description: 'Create a conversation thread in Zep tied to a user',
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
      description: 'Unique identifier for the new thread',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Identifier of the user the thread belongs to',
    },
  },

  request: {
    url: 'https://api.getzep.com/api/v2/threads',
    method: 'POST',
    headers: (params) => ({
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
    body: (params) => ({
      thread_id: params.threadId,
      user_id: params.userId,
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    return {
      success: true,
      output: {
        success: true,
        thread: data,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the thread was created' },
    thread: {
      type: 'object',
      description: 'The created thread object',
      properties: THREAD_OUTPUT_PROPERTIES,
    },
  },
}
