import type { ToolConfig } from '@/tools/types'
import { THREAD_OUTPUT_PROPERTIES, type ZepResponse } from '@/tools/zep/types'

// List all Zep threads (paginated)
export const zepGetThreadsTool: ToolConfig<any, ZepResponse> = {
  id: 'zep_get_threads',
  name: 'Zep Get Threads',
  description: 'List conversation threads stored in Zep',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Zep API key',
    },
    pageNumber: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number to retrieve (1-based)',
    },
    pageSize: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of threads per page',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://api.getzep.com/api/v2/threads')
      if (
        params.pageNumber !== undefined &&
        params.pageNumber !== null &&
        params.pageNumber !== ''
      ) {
        url.searchParams.set('page_number', String(params.pageNumber))
      }
      if (params.pageSize !== undefined && params.pageSize !== null && params.pageSize !== '') {
        url.searchParams.set('page_size', String(params.pageSize))
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
      description: 'List of threads',
      items: { type: 'object', properties: THREAD_OUTPUT_PROPERTIES },
    },
    total_count: { type: 'number', description: 'Total number of threads', optional: true },
    row_count: { type: 'number', description: 'Number of threads returned', optional: true },
  },
}
