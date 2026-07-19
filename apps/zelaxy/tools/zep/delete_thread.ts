import type { ToolConfig } from '@/tools/types'
import type { ZepResponse } from '@/tools/zep/types'

// Delete a Zep thread
export const zepDeleteThreadTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_delete_thread',
  name: 'Zep Delete Thread',
  description: 'Delete a conversation thread and its messages from Zep',
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
      description: 'Identifier of the thread to delete',
    },
  },

  request: {
    url: (params) => `https://api.getzep.com/api/v2/threads/${encodeURIComponent(params.threadId)}`,
    method: 'DELETE',
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
        success: true,
        result: data,
      },
    }
  },

  outputs: {
    success: { type: 'boolean', description: 'Whether the thread was deleted' },
    result: { type: 'json', description: 'Raw API response', optional: true },
  },
}
