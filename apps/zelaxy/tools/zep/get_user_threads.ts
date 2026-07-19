import type { ToolConfig } from '@/tools/types'
import { THREAD_OUTPUT_PROPERTIES, type ZepResponse } from '@/tools/zep/types'

// List all threads that belong to a Zep user
export const zepGetUserThreadsTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_get_user_threads',
  name: 'Zep Get User Threads',
  description: 'List all conversation threads that belong to a specific Zep user',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zep API key',
    },
    userId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Identifier of the user whose threads to list',
    },
  },

  request: {
    url: (params) =>
      `https://api.getzep.com/api/v2/users/${encodeURIComponent(params.userId)}/threads`,
    method: 'GET',
    headers: (params) => ({
      Authorization: `Api-Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json().catch(() => ({}))
    const threads = Array.isArray(data?.threads) ? data.threads : Array.isArray(data) ? data : []
    return {
      success: true,
      output: {
        threads,
        total_count: data?.total_count,
        row_count: data?.row_count,
      },
    }
  },

  outputs: {
    threads: {
      type: 'array',
      description: 'List of threads belonging to the user',
      items: { type: 'object', properties: THREAD_OUTPUT_PROPERTIES },
    },
    total_count: { type: 'number', description: 'Total number of threads', optional: true },
    row_count: { type: 'number', description: 'Number of threads returned', optional: true },
  },
}
