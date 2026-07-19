import type { ToolConfig } from '@/tools/types'
import type { ZepResponse } from '@/tools/zep/types'

// Get the memory context block for a Zep thread
export const zepGetContextTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_get_context',
  name: 'Zep Get Context',
  description: 'Retrieve the synthesized memory context block for a Zep thread',
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
      description: 'Identifier of the thread to get context for',
    },
    minRating: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional minimum fact rating (0-1) to include in the context',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://api.getzep.com/api/v2/threads/${encodeURIComponent(params.threadId)}/context`
      )
      if (params.minRating !== undefined && params.minRating !== null && params.minRating !== '') {
        url.searchParams.set('minRating', String(params.minRating))
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
        context: typeof data?.context === 'string' ? data.context : undefined,
        result: data,
      },
    }
  },

  outputs: {
    context: { type: 'string', description: 'The synthesized memory context block' },
    result: { type: 'json', description: 'Raw API response', optional: true },
  },
}
